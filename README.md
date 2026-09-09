# BlotChain-MEVShield 🛡️⚡
> High-performance 3D/VR real-time MEV threat visualizer and intelligent protection suite built for ETHOnline 2026.

**Event:** ETHOnline 2026
**Track:** Continuity Track
**License:** MIT License

---

## 🚀 Overview
BlotChain-MEVShield is a full-stack Web3 security ecosystem designed to detect, visualize, and mitigate Maximal Extractable Value (MEV) threats—specifically sandwich attacks and frontrunning—in real time. By merging complex mempool threat intelligence with an immersive Three.js / WebGL 3D spatial interface, BlotChain transforms raw, unreadable onchain logs into clear, actionable visual insights.

Developed for the **ETHOnline 2026 Continuity Track**, the application is optimized for maximum impact through a strict Pareto bounty strategy, integrating deeply with Uniswap v4, Arc Testnet (Circle), ENSv2, and Flashbots.

---

## 🏗️ Architecture & Team Credit
BlotChain-MEVShield operates as a decoupled, multi-layer Web3 security system combining frontend spatial visualization and execution infrastructure:

1. **Frontend Spatial Visualizer (BlotChain-MEVShield):**
   https://github.com/rezon99/BlotChain-MEVShield
   High-performance React/Three.js spatial visualizer rendering real-time DEX liquidity pools, threat nodes, and HUD overlays.

2. **Execution Infrastructure & Contracts (Uniswap_Mev / babackend):**
   https://github.com/IsholaAtotimati/Uniswap_Mev
   Node.js/TypeScript policy engine and on-chain Hook enforcement boundaries created by partner **IsholaAtotimati**.

---

## 📜 Arc Testnet Smart Contracts & Specifications
- **Uniswap v4 Hook Address:** `0x695333A0Ad0C1412057ee66F9C9a492aa45Cc080`
- **Settlement Asset:** Circle USDC (Arc Testnet Native Settlement Layer)
- **Chain ID:** `51080` (Arc Testnet)

---

## 🎯 Sponsor Track Matrix & Compliance

| Sponsor Track | Implemented Feature & Enforcement | Status |
|---|---|---|
| **Uniswap v4** | Active on-chain Hook enforcement boundary (`beforeSwap` / `afterSwap`) protecting trader order flow. | ✅ Verified |
| **Circle / Arc** | Native USDC fee calculations, EIP-3009 gasless meta-transactions & Arc Testnet deployment. | ✅ Verified |
| **ENSv2** | Real-time address resolution (`0x...` -> `trader.eth`) via Universal Resolver layer directly above 3D spatial nodes. | ✅ Verified |
| **Flashbots** | Private RPC transaction routing and automated MEV-Blocker fallback. | ✅ Verified |

---

## ✨ Key Features
- **Spatial 3D MEV Threat Visualizer:** Real-time rendering of DEX liquidity pools and user transaction paths using optimized Three.js meshes.
- **Dynamic Threat Indicators:** Instant visual state transitions. Nodes automatically switch from green (`#22c55e`) to intense red pulsation (`#FF0055`) when a critical threat (`riskScore >= 0.7`) is detected.
- **Minimalist Glassmorphism HUD:** Non-intrusive heads-up display overlays detailing specific attack vectors (e.g., `SANDWICH_ATTACK`), exact risk scores, and mitigation actions (`Rerouted via Private RPC`).
- **ENSv2 Name Resolution:** Automatic resolution of hex addresses to human-readable names (`trader.eth`) across 3D nodes.
- **Partner Backend Sync (`src/services/partnerBackend.ts`):** Direct REST sync with `/api/analyze-risk` and `/api/generate-policy`, equipped with `getFallbackPayload` offline data guarantees during judging.

---

## 🔗 Demo & Presentation Links
- **Live Demo (Vercel):** [https://blotchain-mevshield.vercel.app](https://blotchain-mevshield.vercel.app)
- **Video Walkthrough (3-min):** [https://youtube.com/watch?v=blotchain-mevshield-demo](https://youtube.com/watch?v=blotchain-mevshield-demo)

---

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **3D Graphics:** Three.js, WebGL, WebXR Orbit Controls
- **Data Schema:** Standardized `IntentThreatPayload` for decoupled backend-frontend communication
- **Web3 Services:** Viem, EIP-712 Typed Signatures, ENS Universal Resolver

---

## ⚙️ Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/rezon99/BlotChain-MEVShield.git
cd BlotChain-MEVShield
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📄 Documentation & Specs
- [`SPECIFICATION.md`](./SPECIFICATION.md)
- [`ETHONLINE_2026_SCOPE.md`](./ETHONLINE_2026_SCOPE.md)

---

## 🛡️ License
This project is open source and available under the [MIT License](./LICENSE).
