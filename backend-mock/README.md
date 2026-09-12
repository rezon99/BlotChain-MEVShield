# BlotChain-MEVShield Risk Backend Microservice (`/backend-mock`)

BlotChain-MEVShield default Level 1 risk backend. Replaces the partner backend until it is delivered.

## Local Execution

```bash
cd backend-mock
npm install
npm start
```

By default, the service listens on `process.env.PORT || 8080`.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP server port | `8080` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `CORS_ORIGIN` | Allowed CORS origins filter | `https://blot-chain-mev-shield.vercel.app` |
| `SETTLEMENT_DOMAIN_ID` | Arc settlement domain ID placeholder | `1` |
| `MOCK_SIGNER_PRIVATE_KEY` | EIP-712 signing private key. If empty in dev, uses well-known dev key. | `""` |
| `COINGECKO_API_KEY` | CoinGecko API key for price telemetry | `""` |
| `FLASHBOTS_RELAY_URL` | Flashbots relay RPC endpoint | `https://rpc.flashbots.net` |

## Endpoints

### 1. `GET /health`
Returns service status, package name, version, and uptime.

```bash
curl http://localhost:8080/health
```

### 2. `POST /swap/analyze`
Submits swap parameters and returns signed EIP-712 risk payload.

```bash
curl -X POST http://localhost:8080/swap/analyze \
  -H "Content-Type: application/json" \
  -d '{"sender":"0x0000000000000000000000000000000000000001","tokenIn":"ETH","tokenOut":"USDC","amountIn":1,"chainId":1}'
```

### 3. `POST /api/analyze`
Computes quick risk telemetry and toxicity scores.

```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"amountIn":1,"tokenIn":"ETH","tokenOut":"USDC"}'
```

### 4. `GET /api/swaps/events`
Streams live mock swap events for the BlotChain 3D visualizer.

```bash
curl http://localhost:8080/api/swaps/events
```

## Known Limitations

- **Signature**: Uses EIP-712 typed-data signing via `MOCK_SIGNER_PRIVATE_KEY` (or well-known dev key if unset). In production with no key set, responses indicate `isValid: false`.
- **On-chain Settlement**: Settlement execution is simulated off-chain for visualization; transactions are not sent to live Ethereum/Arc contracts.
- **Domain ID**: `destinationDomain` uses placeholder ID configuration (`SETTLEMENT_DOMAIN_ID`).
