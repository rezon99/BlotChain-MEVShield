# BlotChain-MEVShield 🛡️⚡
> High-performance 3D/VR real-time MEV threat visualizer and intelligent protection suite built for ETHOnline 2026.

**Event:** ETHOnline 2026
**Track:** Continuity Track
**License:** MIT

---

## 🚀 Overview
BlotChain-MEVShield is a decoupled Web3 security system designed to detect, visualize, and mitigate Maximal Extractable Value (MEV) threats—specifically sandwich attacks and frontrunning—in real time. By merging complex mempool threat intelligence with an immersive Three.js / WebGL 3D spatial interface, BlotChain transforms raw, unreadable onchain logs into clear, actionable visual insights.

Developed for the ETHOnline 2026 Continuity Track, the application is optimized for maximum impact through a strict Pareto bounty strategy, integrating deeply with Uniswap V3, ENS mainnet resolver (ENSv2 integration planned), and Arc (Circle).

---

## ✨ Key Features
- **Spatial 3D MEV Threat Visualizer:** Real-time rendering of DEX liquidity pools and user transaction paths using optimized Three.js meshes.
- **Resilient 3-Tier Failover Chain:** Multi-level backend architecture ensuring 100% UI availability during judge evaluation:
  1. *Level 1 Default Primary:* Live risk engine backend microservice (`/backend-mock`, deployed on Railway at `https://talented-wonder-production.up.railway.app`)
  2. *Level 2 Secondary:* Cloud microservice fallback service
  3. *Level 3 Tertiary:* Client-side local simulation guard
- **Dynamic Threat Indicators:** Instant visual state transitions. Nodes automatically switch from gentle breathing green (`#22c55e`) to intense red pulsation (`#FF0055`) when a critical threat (`riskScore >= 0.7`) is detected.
- **Minimalist Glassmorphism HUD:** Non-intrusive heads-up display overlays detailing specific attack vectors (e.g., `SANDWICH_ATTACK`), exact risk scores, and mitigation actions (`Flashbots relay health monitored (rerouting planned)`).
- **ENS Name Resolution:** Automatic resolution of hex addresses to human-readable names (`trader.eth`) across 3D nodes via ENS mainnet resolver (ENSv2 integration planned).
- **IsholaAtotimati Backend Adapter:** Seamless transformation of `SignedRiskPayload` and `SwapEvent` structures from the IsholaAtotimati risk engine into 3D node graphs (Signature enforcement via partner risk engine; v4 Hook lives in partner's contracts).

---

## 🎯 Sponsor Bounty Strategy (Pareto Optimized)
The project architecture is strategically aligned to maximize ROI across high-value sponsor ecosystems:
- **Uniswap Foundation (Continuity Track):** Focuses on protecting Uniswap V3 traders from sandwich attacks and route manipulation. Signature enforcement via partner risk engine; v4 Hook lives in partner's contracts.
- **ENS (ENS mainnet resolver; ENSv2 integration planned):** Enhances user experience by resolving wallet and contract addresses into human-readable ENS identities within the 3D graph.
- **Arc / Circle:** Arc / Circle USDC settlement (planned); fee calculation is live in UI.

---

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **3D Graphics:** Three.js, WebGL
- **Data Schema:** Standardized `IntentThreatPayload` for decoupled backend-frontend communication
- **Backend Architecture:** Multi-tier failover adapter (`src/services/partnerBackend.ts`)
- **Secondary Cloud Fallback Microservice:** Node.js / Express (`/backend-mock`)
- **Tooling:** ESLint, Prettier, ResizeObserver API

---

## 📂 Project Structure
```
BlotChain-MEVShield/
├── src/
│   ├── components/
│   │   └── ThreatVisualizer3D.tsx  # Core Three.js spatial visualizer & HUD
│   ├── services/
│   │   ├── partnerBackend.ts       # 3-tier failover adapter & backend integration
│   │   └── index.ts
│   ├── types/
│   │   └── mev.ts                  # IntentThreatPayload & node type definitions
│   └── App.tsx
├── backend-mock/                   # Default Level 1 risk engine backend microservice (deployed on Railway)
├── ISHOLA_ATOTIMATI_ADAPTER.md
├── SPECIFICATION.md
├── ETHONLINE_2026_SCOPE.md
└── README.md
```

---

## ⚙️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/rezon99/BlotChain-MEVShield.git
cd BlotChain-MEVShield
```

### 2. Install Dependencies
```bash
npm install
```
> **Note:** `package-lock.json` is the single lockfile source of truth for this repository.

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
Detailed architectural specifications and development scopes can be found in the repository root:
- [`ISHOLA_ATOTIMATI_ADAPTER.md`](./ISHOLA_ATOTIMATI_ADAPTER.md) — Detailed documentation & interaction sequence diagram for the IsholaAtotimati backend adapter
- [`backend-mock/README.md`](./backend-mock/README.md) — Cloud fallback microservice documentation
- [`SPECIFICATION.md`](./SPECIFICATION.md)
- [`ETHONLINE_2026_SCOPE.md`](./ETHONLINE_2026_SCOPE.md)

---

## ⚠️ Known Limitations & Roadmap
- ENS resolution: standard ENS mainnet resolver — ENSv2 (Sepolia) integration is planned, not yet implemented
- Arc USDC settlement: fee calculation is live; actual on-chain settlement transaction is simulated, not yet connected to a real Arc/Circle rail
- Flashbots: relay health monitoring is live; actual transaction rerouting through the protected RPC is not yet wired into the swap-submission flow
- Uniswap v4 Hook enforcement: handled by the partner's on-chain contracts (IsholaAtotimati/Uniswap_Mev), not part of this repository's execution path
- Attack classification (SANDWICH, TOXIC_FLOW, etc.) is threshold-based on a single risk score, not multi-signal evidence classification
- Tier 1 (partner backend) and Tier 2 (backend-mock) currently point to the same Railway instance; a fully independent Tier 2 deployment is planned post-hackathon
- Frontend signature verification: EIP-712 recovery is now client-side; trust model assumes the backend's expected signer address is configured correctly

---

## 🛡️ License
This project is licensed under the MIT License - see the [`LICENSE`](./LICENSE) file for details.
