// backend/db.js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'stress.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    label TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id INTEGER NOT NULL REFERENCES targets(id),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    concurrency INTEGER,
    requests_per_sec REAL,
    error_rate REAL,
    p50 REAL,
    p90 REAL,
    p95 REAL,
    p99 REAL,
    stopped_reason TEXT
  );
`);

function getOrCreateTarget(url, label) {
  const existing = db.prepare('SELECT * FROM targets WHERE url = ?').get(url);
  if (existing) return existing;
  const info = db.prepare('INSERT INTO targets (url, label) VALUES (?, ?)').run(url, label || null);
  return db.prepare('SELECT * FROM targets WHERE id = ?').get(info.lastInsertRowid);
}

function insertRun(run) {
  const info = db.prepare(`
    INSERT INTO runs (target_id, concurrency, requests_per_sec, error_rate, p50, p90, p95, p99, stopped_reason)
    VALUES (@target_id, @concurrency, @requests_per_sec, @error_rate, @p50, @p90, @p95, @p99, @stopped_reason)
  `).run(run);
  return db.prepare('SELECT * FROM runs WHERE id = ?').get(info.lastInsertRowid);
}

function getTargetsWithLatestRun() {
  return db.prepare(`
    SELECT
      t.id,
      t.url,
      t.label,
      t.created_at,
      r.requests_per_sec,
      r.p99,
      r.timestamp AS last_run_at
    FROM targets t
    LEFT JOIN runs r ON r.id = (
      SELECT id FROM runs WHERE target_id = t.id ORDER BY timestamp DESC, id DESC LIMIT 1
    )
    ORDER BY t.id
  `).all();
}

function getRunsForTarget(targetId) {
  return db.prepare('SELECT * FROM runs WHERE target_id = ? ORDER BY timestamp ASC, id ASC').all(targetId);
}

function getAggregate() {
  const worst = db.prepare(`
    SELECT r.p99, r.timestamp, t.id AS target_id, t.url, t.label
    FROM runs r JOIN targets t ON t.id = r.target_id
    ORDER BY r.p99 DESC LIMIT 1
  `).get();

  const avgErrorRate = db.prepare('SELECT AVG(error_rate) AS avg_error_rate FROM runs').get();

  const ranked = db.prepare(`
    SELECT t.id AS target_id, t.url, t.label, AVG(r.p99) AS avg_p99, COUNT(r.id) AS run_count
    FROM targets t JOIN runs r ON r.target_id = t.id
    GROUP BY t.id
    ORDER BY avg_p99 DESC
  `).all();

  return {
    worst: worst || null,
    averageErrorRate: avgErrorRate.avg_error_rate ?? null,
    ranked,
  };
}

module.exports = {
  db,
  getOrCreateTarget,
  insertRun,
  getTargetsWithLatestRun,
  getRunsForTarget,
  getAggregate,
};
