// backend/services/stressTest.js

const autocannon = require('autocannon');
const appEmitter = require('../utils/eventEmitter');
const db = require('../db');

let instance;

function percentile(sortedArr, p) {
    if (sortedArr.length === 0) return 0;
    const idx = Math.min(sortedArr.length - 1, Math.ceil((p / 100) * sortedArr.length) - 1);
    return sortedArr[idx];
}

// This function starts the test
function start(config) {
    const { url, connections, duration, label } = config;

    instance = autocannon({
        url,
        connections: parseInt(connections, 10),
        duration: parseInt(duration, 10),
    });

    let latencySamples = [];
    let allLatencySamples = [];

    // autocannon's 'tick' event only carries { counter, bytes } — no
    // requests/latency stats (those exist only on the final 'done' result).
    // Build the shape the frontend expects from what's actually available:
    // counter = requests completed since last tick (~req/s), and a rolling
    // p99 computed from per-request response times collected via 'response'.
    instance.on('response', (client, statusCode, resBytes, responseTime) => {
        latencySamples.push(responseTime);
        allLatencySamples.push(responseTime);
    });

    instance.on('tick', (data) => {
        const sorted = latencySamples.slice().sort((a, b) => a - b);
        appEmitter.emit('test:progress', {
            requests: { mean: data.counter },
            latency: { p99: percentile(sorted, 99) },
        });
        latencySamples = [];
    });

    instance.on('done', (result) => {
        console.log('Test completed!');

        const sorted = allLatencySamples.slice().sort((a, b) => a - b);
        const p50 = percentile(sorted, 50);
        const p90 = percentile(sorted, 90);
        const p95 = percentile(sorted, 95);
        const p99 = percentile(sorted, 99);

        const totalRequests = result.requests?.total ?? result.requests?.sent ?? sorted.length;
        const errorCount = (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
        const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
        const requestsPerSec = result.requests?.average ?? result.requests?.mean ?? 0;

        const target = db.getOrCreateTarget(url, label || null);
        const run = db.insertRun({
            target_id: target.id,
            concurrency: parseInt(connections, 10),
            requests_per_sec: requestsPerSec,
            error_rate: errorRate,
            p50,
            p90,
            p95,
            p99,
            stopped_reason: null,
        });

        appEmitter.emit('test:complete', {
            ...result,
            computed: { p50, p90, p95, p99, errorRate },
            run,
            target,
        });
    });

    autocannon.track(instance);
    console.log(`Stress test started on ${url}`);
    return { message: 'Test started successfully' };
}

function stop() {
    if (instance) {
        instance.stop();
        console.log('Stress test stopped by user.');
        return { message: 'Test stopped successfully.' };
    }
    return { message: 'No active test to stop.' };
}

module.exports = { start, stop };