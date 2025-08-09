// backend/utils/eventEmitter.js

// Import the built-in 'events' module from Node.js
const EventEmitter = require('events');

// Create a single, shared instance of the emitter
const appEmitter = new EventEmitter();

// Export it so other files can use this same instance
module.exports = appEmitter;