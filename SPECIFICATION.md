# BlotChain x MEVShield — Technical Specification & Architecture

## System Architecture
BlotChain x MEVShield is a decoupled Visual MEV & Intent Security Suite:
1. **MEVShield Backend Service:** Parses user intents, simulates mempool states, calculates riskScores, and routes transactions via Private RPCs.
2. **BlotChain Visualizer (Frontend):** Renders DEX liquidity pools and user intents in 2D, 3D (Three.js), and WebXR VR spatial node graphs.
3. **Polygon & IPFS State Archiver:** Mints ERC-721 "Proof-of-Protection" NFTs on Polygon Mainnet with Pinata IPFS metadata.

## API Data Contract (IntentThreatPayload)
All communications between backend/simulators and the BlotChain visualizer must conform to this schema:

```json
{
  "intentId": "intent_0x9f8a1b2c3d4e...",
  "timestamp": 1789370000,
  "userAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "status": "PROTECTED_AND_EXECUTED",
  "riskAssessment": {
    "riskScore": 0.85,
    "threatLevel": "CRITICAL",
    "detectedThreats": ["SANDWICH_ATTACK"],
    "actionTaken": "ROUTED_PRIVATE_RPC"
  },
  "visualization": {
    "nodes": [
      {
        "id": "node_user",
        "label": "User Wallet",
        "type": "WALLET",
        "threatColor": "#00FF66",
        "isPulsing": false
      },
      {
        "id": "node_pool",
        "label": "Uniswap V3 ETH/USDC",
        "type": "DEX_POOL",
        "threatColor": "#FF0055",
        "isPulsing": true
      }
    ],
    "flows": [
      {
        "fromNodeId": "node_user",
        "toNodeId": "node_pool",
        "volumeUsd": 10000,
        "particleColor": "#FF0055",
        "particleSpeed": 2.0
      }
    ]
  }
}
```

## User Stories & Acceptance Criteria
- **US-01 (3D Threat Vector Visualization):** High-risk pools (`riskScore >= 0.7`) MUST render with pulsing red glow (`#FF0055`) and high-velocity particle streams. Low-risk nodes render green (`#00FF66`).
- **US-02 (Polygon NFT Minting):** After private RPC execution, the user can trigger `mintSnapshot()` on Polygon Mainnet (Contract: `0x9A0Fb6820096e70aB55Ed597B2596a79a85144dA`).
