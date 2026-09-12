# BlotChain-MEVShield Risk Engine Microservice (`/backend-mock`)

This folder contains the **default Level 1 risk engine microservice** (deployed on Railway at `https://talented-wonder-production.up.railway.app`).

## Architecture & Purpose

To ensure high availability during judge evaluation and live demonstrations:
- The **`/backend-mock`** directory contains this production-ready risk engine microservice acting as the **Default Level 1 Backend**.
- The **`/backend`** directory path is reserved for partner backend code integration (The Graph + Uniswap v4 Hook).
- The frontend (`partnerBackend.ts`) seamlessly executes a 3-tier failover chain: Level 1 Default Backend Microservice -> Level 2 Cloud Fallback -> Level 3 Tertiary Local Client Simulation Guard.

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
