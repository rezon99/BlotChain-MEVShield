# 🏆 ETHOnline 2026 — Continuity Track Project: BlotChain x MEVShield

> **Visual MEV & Intent Security Suite**
> Real-Time Spatial Threat Visualizer (2D, 3D Three.js, WebXR VR) with Polygon Proof-of-Protection State Archiving & Pinata IPFS metadata pinning.

---

## 🎯 Hackathon Track Alignment

| Track / Category | Description | Integration Details |
| --- | --- | --- |
| **MEV & Security** | Intent Threat Analysis & Protection | Real-time mempool simulation, risk scoring (`riskScore >= 0.7`), and private RPC transaction routing. |
| **DeFi & Analytics** | 2D/3D/VR Spatial Visualization | Visualizing DEX liquidity pools, threat vectors, particle flow velocities, and threat statuses. |
| **Polygon Mainnet** | Proof-of-Protection NFT Minting | Minting ERC-721 snapshot NFTs on Polygon Mainnet (`0x9A0Fb6820096e70aB55Ed597B2596a79a85144dA`). |
| **IPFS / Filecoin** | Decentralized State Archiving | Pinning canvas state snapshots and threat metadata to IPFS via Pinata SDK. |

---

## 📄 Technical Specification & Hackathon Scope

- 📐 **[Technical Specification & Architecture (SPECIFICATION.md)](./SPECIFICATION.md)** — Detailed system architecture, `IntentThreatPayload` API contract schema, and user story acceptance criteria.
- 📋 **[ETHOnline 2026 Continuity Track Scope (ETHONLINE_2026_SCOPE.md)](./ETHONLINE_2026_SCOPE.md)** — Breakdown of foundation features built prior to ETHOnline 2026 vs new deliverables built during the hackathon.

---

## 🟢 Implemented Baseline in Fork ([rezon99/BlotChain](https://github.com/rezon99/BlotChain))

Prior to ETHOnline 2026, the base BlotChain spatial visualizer fork included:

- **2D SVG Spatial Graph Visualizer:** Interactive graph canvas with drag-and-drop physics, node selection, particle flow animations, category filtering, and responsive SVG auto-resizing.
- **3D Three.js WebGL Dashboard:** 3D force-directed node graph with animated flow particles, orbit camera controls, glowing threat vector materials, and dynamic lighting.
- **WebXR VR Viewport Mode:** Immersive VR mode for spatial node graph inspection and headset orientation tracking.
- **Real-Time CoinGecko Market Polling:** Live market data polling for Crypto assets and NFT collections with customizable refresh intervals and local storage state persistence.
- **Interactive Analytics & Comparisons:** Side-by-side node comparison drawer (price, liquidity, volume, 24h/7d change), sparkline trend charts, and interactive cascade click feedback.
- **Canvas State Export:** Export full network topology to high-resolution PNG images and JSON payloads.

---

## 🚀 Getting Started & Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```
