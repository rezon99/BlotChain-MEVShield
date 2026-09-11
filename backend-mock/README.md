# BlotChain-MEVShield Cloud Fallback Risk Engine (`/backend-mock`)

This folder contains the **secondary cloud fallback risk engine microservice**.

## Architecture & Purpose

To ensure high availability during judge evaluation and live demonstrations:
- The **`/backend`** directory path is kept clean for the primary partner backend (The Graph + Uniswap v4 Hook).
- The **`/backend-mock`** directory contains this deployed standalone cloud microservice.
- If the primary partner backend is offline or undergoing high latency, the frontend (`partnerBackend.ts`) automatically switches to this cloud microservice as **Level 2 Secondary Cloud Fallback**.

## API Endpoints

- `GET /health` — Health check & uptime
- `POST /swap/analyze` — Submits swap parameters & returns signed EIP-712 risk payload
- `POST /api/analyze` — Telemetry & toxicity scoring
- `GET /api/swaps/events` — Stream live swap events for the 3D visualizer

## Local Execution

```bash
cd backend-mock
npm install
npm start
```
