// backend/services/stressTest.js

const autocannon = require('autocannon');
const appEmitter = require('../utils/eventEmitter'); 

let instance;

// This function starts the test
function start(config) {
    const { url, connections, duration } = config;

    instance = autocannon({
        url,
        connections: parseInt(connections, 10), 
        duration: parseInt(duration, 10),     
    });

    instance.on('tick', (data) => {
        appEmitter.emit('test:progress', data);
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