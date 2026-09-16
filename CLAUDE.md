# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Zero-Downtime API Stress Dashboard: a two-process app where a Node/Express backend runs HTTP stress tests (via `autocannon`) against a target URL and streams live progress + host system metrics to a Next.js frontend over Server-Sent Events.

## Commands

Backend (`backend/`):
- `npm install`
- `node index.js` — starts server on `http://localhost:3001` (or `$PORT`). No dev/watch script defined.
- No test suite configured (`npm test` is a stub that exits 1).

Frontend (`frontend/`):
- `npm install`
- `npm run dev` — Next.js dev server, `http://localhost:3000`
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- No test suite configured.

There is no root-level package.json — backend and frontend are run/installed independently, each from its own directory.

## Architecture

**Backend (`backend/`)** — single Express app (`index.js`) plus two small modules:
- `utils/eventEmitter.js` — one shared Node `EventEmitter` instance used as an internal pub/sub bus ("radio station") between the stress-test service and the HTTP layer.
- `services/stressTest.js` — wraps `autocannon`, exposing `start(config)` / `stop()`. Emits `test:progress` (on autocannon `tick`) and `test:complete` (on autocannon `done`) onto the shared emitter. Only one test instance runs at a time (module-level `instance` var, no queuing).
- `index.js` wires it together:
  - `GET /metrics` — opens an SSE stream per client (tracked in an in-memory `clients` array). A `setInterval` every 2s pushes `system:update` events (CPU/mem via `systeminformation`) to all connected clients. Backend listeners on the shared emitter forward `test:progress`/`test:complete` to the same SSE clients via `broadcast()`.
  - `POST /stress` — `{ action: 'start'|'stop', config }` starts/stops the stress test.
  - `GET /export?format=csv|json` — re-serves the last completed test result (`lastTestResult`, in-memory, overwritten each run — not persisted, not per-client).
  - Global rate limiter (100 req/15min) and open CORS (`origin: '*'`).

**Frontend (`frontend/`)** — Next.js App Router, single page at `src/app/page.js`:
  - Opens one `EventSource` to `${NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/metrics` on mount; listens for `system:update`, `test:progress` (appended into a sliding 20-point `chartData` window), and `test:complete`.
  - `ConfigForm` submits form data as the `config` object for `POST /stress` (start); a separate stop button posts `{ action: 'stop' }`.
  - `MetricsChart` (Recharts) renders `chartData` — used twice, once per metric (`yKey` dot-path like `requests.mean` or `latency.p99`).
  - `ResultsSummary` renders `finalResults` and triggers export downloads via `window.open` to `/export?format=...`.
  - All cross-component state (test status, live chart data, system metrics, final results) lives in `page.js`; components are presentational and receive data/handlers as props.
  - Styling: Tailwind CSS v4 (via `@tailwindcss/postcss`), dark theme hardcoded (`bg-black text-white`).

Frontend and backend communicate only over HTTP/SSE at the URL in `NEXT_PUBLIC_API_URL` (no shared types/schema — keep the `config` shape and event payload shapes in sync manually when changing either side).
