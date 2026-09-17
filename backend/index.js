// backend/index.js

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const si = require('systeminformation');
const { Parser } = require('json2csv');
const stressTestService = require('./services/stressTest');
const appEmitter = require('./utils/eventEmitter'); // Import our "radio station"
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;


let clients = [];
let lastTestResult = null;


app.use(express.json());
app.use(cors({ origin: '*' }));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
});
app.use(limiter);

app.get('/metrics', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream'); 
    res.setHeader('Cache-Control', 'no-cache');         
    res.setHeader('Connection', 'keep-alive');          
    res.flushHeaders(); 

    const clientId = Date.now();
    clients.push({ id: clientId, res }); 
    console.log(`Client ${clientId} connected`);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId); 
        console.log(`Client ${clientId} disconnected`);
    });
});

// This function sends messages to all connected clients
function broadcast(event, data) {
  // Format the message according to the SSE specification
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  // Send the message to every connected client
    clients.forEach(client => client.res.write(message));
}

// --- Periodically send system metrics ---

setInterval(async () => {
    try {
        const [cpu, mem] = await Promise.all([si.currentLoad(), si.mem()]);
        const metrics = {
        cpu: cpu.currentLoad.toFixed(2),
        memory: ((mem.active / mem.total) * 100).toFixed(2),
    };
    // Broadcast system stats to all clients
    broadcast('system:update', metrics);
    } catch (error) {
        console.error('Error fetching system info:', error);
    }
}, 2000);

// --- Here is where we "listen" to our internal radio station ---
appEmitter.on('test:progress', (data) => broadcast('test:progress', data));
appEmitter.on('test:complete', (result) => {
    lastTestResult = result; // Save the final result for the export feature
    broadcast('test:complete', result);
});

// --- API Routes ---
// This is the endpoint for starting and stopping tests
app.post('/stress', (req, res) => {
  const { action, config } = req.body; // Get action ('start' or 'stop') from the request
  if (action === 'start') {
    const result = stressTestService.start(config);
    return res.status(200).json(result);
  } else if (action === 'stop') {
    const result = stressTestService.stop();
    return res.status(200).json(result);
  }
  return res.status(400).json({ error: 'Invalid action.' });
});

// This is the endpoint for downloading test results
app.get('/export', (req, res) => {
  if (!lastTestResult) {
    return res.status(404).json({ error: 'No test result available.' });
  }

  const { format } = req.query; // Get format from URL, e.g., /export?format=csv

  if (format === 'csv') {
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(lastTestResult);
    res.header('Content-Type', 'text/csv');
    res.attachment('stress-test-results.csv'); // Tells browser to download the file
    return res.send(csv);
  }
  
  // Default to JSON format
  res.header('Content-Type', 'application/json');
  res.attachment('stress-test-results.json');
  return res.json(lastTestResult);
});

// This is the endpoint for listing targets with their latest run stats
app.get('/targets', (req, res) => {
  res.json(db.getTargetsWithLatestRun());
});

// This is the endpoint for a single target's full run history
app.get('/targets/:id/runs', (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  if (Number.isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid target id.' });
  }
  res.json(db.getRunsForTarget(targetId));
});

// Least-squares slope of y over x (standard linear regression formula)
function linearRegressionSlope(xs, ys) {
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

// This is the endpoint for a target's p99 trend over its run history
app.get('/analysis/trend/:targetId', (req, res) => {
  const targetId = parseInt(req.params.targetId, 10);
  if (Number.isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid target id.' });
  }

  const runs = db.getRunsForTarget(targetId);
  if (runs.length < 2) {
    return res.json({ targetId, slope: 0, label: 'stable', reason: 'insufficient_data', runCount: runs.length });
  }

  // x = run sequence index (0, 1, 2, ...), not raw timestamp — keeps the
  // slope's units (latency change per run) meaningful regardless of how
  // far apart runs happened in real time.
  const xs = runs.map((_, i) => i);
  const ys = runs.map((r) => r.p99);
  const slope = linearRegressionSlope(xs, ys);
  const meanP99 = ys.reduce((a, b) => a + b, 0) / ys.length;
  const relativeSlope = meanP99 !== 0 ? slope / meanP99 : 0;

  // Threshold: slope magnitude as a fraction of mean p99 per run-step.
  // Anything under 5% per run is noise-level and called "stable".
  const THRESHOLD = 0.05;
  let label = 'stable';
  if (relativeSlope > THRESHOLD) label = 'degrading';
  else if (relativeSlope < -THRESHOLD) label = 'improving';

  res.json({ targetId, slope, meanP99, relativeSlope, label, runCount: runs.length });
});

// This is the endpoint for cross-target aggregate analysis
app.get('/analysis/aggregate', (req, res) => {
  res.json(db.getAggregate());
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});