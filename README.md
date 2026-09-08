# BlotChain-MEVShield 🛡️⚡
> High-performance 3D/VR real-time MEV threat visualizer and intelligent protection suite built for ETHOnline 2026.

**Event:** ETHOnline 2026
**Track:** Continuity Track
**License:** MIT

---

## 🚀 Overview
BlotChain-MEVShield is a decoupled Web3 security system designed to detect, visualize, and mitigate Maximal Extractable Value (MEV) threats—specifically sandwich attacks and frontrunning—in real time. By merging complex mempool threat intelligence with an immersive Three.js / WebGL 3D spatial interface, BlotChain transforms raw, unreadable onchain logs into clear, actionable visual insights.

Developed for the ETHOnline 2026 Continuity Track, the application is optimized for maximum impact through a strict Pareto bounty strategy, integrating deeply with Uniswap V3, ENSv2, and Arc (Circle).

---

## ✨ Key Features
- **Spatial 3D MEV Threat Visualizer:** Real-time rendering of DEX liquidity pools and user transaction paths using optimized Three.js meshes.
- **Dynamic Threat Indicators:** Instant visual state transitions. Nodes automatically switch from gentle breathing green (`#22c55e`) to intense red pulsation (`#FF0055`) when a critical threat (`riskScore >= 0.7`) is detected.
- **Minimalist Glassmorphism HUD:** Non-intrusive heads-up display overlays detailing specific attack vectors (e.g., `SANDWICH_ATTACK`), exact risk scores, and mitigation actions (`Rerouted via Private RPC`).
- **ENSv2 Name Resolution:** Automatic resolution of hex addresses to human-readable names (`trader.eth`) across 3D nodes.
- **Optimized Rendering Architecture:** Lifecycle management decoupled via `useRef`, native `ResizeObserver` container tracking, and `React.memo` wrapping to maintain a stable 60 FPS during high-frequency data streaming.

---

## 🎯 Sponsor Bounty Strategy (Pareto Optimized)
The project architecture is strategically aligned to maximize ROI across high-value sponsor ecosystems:
- **Uniswap Foundation (Continuity Track):** Focuses on protecting Uniswap V3 traders from sandwich attacks and route manipulation.
- **ENS (ENSv2 Beta on Sepolia):** Enhances user experience by resolving wallet and contract addresses into human-readable ENS identities within the 3D graph.
- **Arc / Circle:** Denominates and settles MEV protection routing fees natively in USDC on the Arc ecosystem.

---

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **3D Graphics:** Three.js, WebGL
- **Data Schema:** Standardized `IntentThreatPayload` for decoupled backend-frontend communication
- **Tooling:** ESLint, Prettier, ResizeObserver API

---

## 📂 Project Structure
```
BlotChain-MEVShield/
├── src/
│   ├── components/
│   │   └── ThreatVisualizer3D.tsx  # Core Three.js spatial visualizer & HUD
│   ├── types/
│   │   └── mev.ts                  # IntentThreatPayload & node type definitions
│   ├── hooks/                      # Real-time data synchronization hooks
│   └── App.tsx
├── public/
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
- [`SPECIFICATION.md`](./SPECIFICATION.md)
- [`ETHONLINE_2026_SCOPE.md`](./ETHONLINE_2026_SCOPE.md)

---

## 🛡️ License
This project is licensed under the MIT License - see the [`LICENSE`](./LICENSE) file for details.
