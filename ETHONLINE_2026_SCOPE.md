# BlotChain-MEVShield Project Scope & Strategy

## 1. Hackathon Overview & Objectives
- **Event:** ETHGlobal ETHOnline 2026
- **Track:** Continuity Track
- **Core Product:** High-performance 3D/VR visualizer rendering real-time Maximal Extractable Value (MEV) threat data, optimized for instant user comprehension and automated mitigation.

## 2. Pareto Bounty Strategy (80/20 ROI Focus)
To maximize hackathon impact while preserving existing system architecture, development effort is concentrated exclusively on three high-yield sponsor tracks:

```
+-------------------------------------------------------------+
|                 BlotChain-MEVShield Core                    |
+--------------+-----------------------+----------------------+
               |                       |
               v                       v
     [ Uniswap Foundation ]         [ ENS mainnet resolver (ENSv2 integration planned) ]
   - V3 Sandwich Defense         - Human-Readable
   - Continuity Prize            - Wallet/Node Tags
               \                       /
                v                     v
         [ Arc / Circle ]
       - USDC Fee Settlement
       - Testnet Deployment
```

- **Uniswap Foundation (Continuity Track):**
  - **Focus:** Protecting Uniswap V3 traders from sandwich attacks and mempool exploitation.
  - **Deliverable:** Demonstration of real-time route protection for Uniswap swaps, complete with `FEEDBACK.md` and required developer forms.
- **ENS (ENS mainnet resolver (ENSv2 integration planned)):**
  - **Focus:** User identity and contract transparency.
  - **Deliverable:** Resolving raw hex addresses (`0x...`) into human-readable ENS names (`trader.eth`) directly above 3D spatial nodes.
- **Arc / Circle:**
  - **Focus:** Arc / Circle USDC settlement (planned). Stablecoin-native financial flows.
  - **Deliverable:** Denominating MEV-protection routing fees in USDC.

## 3. Development Roadmap & Milestones

| Phase | Milestone | Target Date | Status |
|---|---|---|---|
| Phase 1 | Repository Initialization & Specs | Sept 5, 2026 | ✅ Completed |
| Phase 2 | Frontend 3D Visualizer & HUD Engine | Sept 6, 2026 | ✅ Completed |
| Phase 3 | Project Check-in #1 & Backend Sync | Sept 7, 2026 | ⏳ In Progress |
| Phase 4 | ENSv2 Integration & Sponsor Optimizations | Sept 8–9, 2026 | 📋 Planned |
| Phase 5 | Project Check-in #2 & Feedback Review | Sept 10, 2026 | 📋 Planned |
| Phase 6 | Video Production & Final Submission | Sept 13, 2026 | 📋 Planned |

## 4. Task Management & Responsibilities
- **Frontend Visualization & UX:** Spatial rendering, Three.js performance tuning, HUD state management, and ENS integration.
- **Backend & MEV Logic:** Threat simulation engine, private RPC routing logic, and payload schema generation.
