// backend/services/stressTest.js

const autocannon = require('autocannon');
const appEmitter = require('../utils/eventEmitter'); 

let instance;

function percentile(sortedArr, p) {
    if (sortedArr.length === 0) return 0;
    const idx = Math.min(sortedArr.length - 1, Math.ceil((p / 100) * sortedArr.length) - 1);
    return sortedArr[idx];
}

// This function starts the test
function start(config) {
    const { url, connections, duration } = config;

    instance = autocannon({
        url,
        connections: parseInt(connections, 10),
        duration: parseInt(duration, 10),
    });

    let latencySamples = [];

    // autocannon's 'tick' event only carries { counter, bytes } — no
    // requests/latency stats (those exist only on the final 'done' result).
    // Build the shape the frontend expects from what's actually available:
    // counter = requests completed since last tick (~req/s), and a rolling
    // p99 computed from per-request response times collected via 'response'.
    instance.on('response', (client, statusCode, resBytes, responseTime) => {
        latencySamples.push(responseTime);
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
        appEmitter.emit('test:complete', result);
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