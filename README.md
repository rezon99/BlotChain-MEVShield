**Track:** Continuity Track

## 🚀 Quick Start

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

### 3. Configure the Backend

The MEVShield backend is located in:

```text
backend-mock/
```

Install its dependencies:

```bash
cd backend-mock

npm install
```

Create a local `.env` file using the backend environment configuration.

> **Security:** Never commit `.env`, private keys, Circle credentials, or other secrets to GitHub.

Return to the project root:

```bash
cd ..
```

### 4. Run the Development Server

Start the frontend:

```bash
npm run dev
```

Start the backend separately:

```bash
cd backend-mock
npm run dev
```

The backend listens on:

```text
http://localhost:4000
```

### 5. Build for Production

Frontend:

```bash
npm run build
```

Backend:

```bash
cd backend-mock
npm run build
```

---

# 🔗 MEVShield Data & Risk Architecture

MEVShield combines **live blockchain state from Arc RPC** with **historical/indexed protocol data from The Graph**.

```text
                         MEVShield
                             │
                             ▼
                    Risk Analysis Engine
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
          Arc RPC                       The Graph
       Live blockchain              Indexed historical
            state                         data
              │                             │
              └──────────────┬──────────────┘
                             ▼
                     Risk Aggregation
                             │
                             ▼
                    Execution Policy
                             │
                             ▼
                  Uniswap v4 MEVShield Hook
                             │
                             ▼
                    Protected Execution
```

### Why both RPC and The Graph?

MEVShield does not treat indexed data as a replacement for live blockchain state.

**Arc RPC** is used for:

* Current blockchain state
* Contract reads
* Transaction submission
* Live execution state
* On-chain verification

**The Graph** is used for:

* Historical execution data
* Indexed Hook events
* Historical settlement activity
* Historical risk/enforcement signals
* Efficient querying without repeatedly scanning the chain

The risk engine combines these sources when evaluating execution conditions.

---

# 📊 The Graph Integration

MEVShield uses a custom subgraph deployed for the Arc Testnet environment.

The subgraph indexes MEVShield Hook activity and provides a queryable historical data layer for the risk engine.

### Arc Testnet

```text
Chain ID: 5042002
```

### Subgraph

The backend is configured through:

```env
GRAPH_API_URL=https://api.studio.thegraph.com/query/1760229/mevshield-arc/0.0.1
```

The Graph endpoint is consumed by the backend rather than directly exposing Graph credentials or implementation details to the frontend.

### Data flow

```text
Arc Testnet
     │
     │ on-chain events
     ▼
MEVShield Hook
     │
     ▼
The Graph Indexer
     │
     ▼
MEVShield Subgraph
     │
     ▼
Graph API
     │
     ▼
Risk Engine
```

The indexed data can be combined with current RPC state to improve historical context during risk evaluation.

---

# 🧠 Risk Engine

MEVShield performs risk analysis off-chain before protected execution.

The risk engine includes components for:

* Feature extraction
* Sandwich-risk detection
* Toxic-flow analysis
* Arbitrage analysis
* Wallet profiling
* Risk aggregation
* Loss estimation
* Fee recommendation
* Execution-policy validation

The architecture intentionally separates **risk computation** from **on-chain enforcement**.

```text
Transaction
     │
     ▼
Feature Extraction
     │
     ├──────────────► Arc RPC
     │
     └──────────────► The Graph
                         │
                         ▼
                  Historical Context
                         │
                         ▼
                   Risk Aggregation
                         │
                         ▼
                  Execution Policy
                         │
                         ▼
                  Uniswap v4 Hook
```

---

# 🦄 Uniswap v4 Enforcement

The MEVShield Hook provides the on-chain enforcement layer.

The backend does not simply return a simulated risk result. It produces the execution-policy information used by the protected execution flow.

Relevant Hook events include:

* `RiskChecked`
* `LossProtectionApplied`
* `ExecutionRejected`
* `SettlementCreated`
* `SettlementAuthorized`
* `SettlementExecuted`
* `SettlementCompleted`
* `SettlementFailed`
* `SettlementCancelled`
* `SettlementRetried`

`RiskChecked` records the result of the policy check, including approval status, fee, and reason.

`LossProtectionApplied` provides additional execution-risk information including expected LP loss, expected leakage, toxicity score, and spread.

---

# 💰 Protected Execution Flow

```text
User
 │
 ▼
Frontend
 │
 ▼
MEVShield Backend
 │
 ├── Arc RPC ──────────────► Current State
 │
 └── The Graph ────────────► Historical State
 │
 ▼
Risk Engine
 │
 ▼
Execution Policy
 │
 ▼
Uniswap v4 MEVShield Hook
 │
 ├── Approved ─────────────► Protected Execution
 │
 └── Rejected ─────────────► Execution Blocked
```

This architecture gives MEVShield a clear separation between:

**Analysis → Policy → Enforcement**

---

# 📄 Documentation & Specs

Detailed architectural specifications and development scopes can be found in the repository root:

* [`ISHOLA_ATOTIMATI_ADAPTER.md`](./ISHOLA_ATOTIMATI_ADAPTER.md) — Backend adapter architecture and interaction sequence
* [`backend-mock/README.md`](./backend-mock/README.md) — MEVShield Risk Backend documentation
* [`SPECIFICATION.md`](./SPECIFICATION.md) — Protocol specification
* [`ETHONLINE_2026_SCOPE.md`](./ETHONLINE_2026_SCOPE.md) — ETHOnline 2026 implementation scope

---

# ⚠️ Known Limitations & Roadmap

### Current implementation

* **Risk Analysis:** Performed off-chain by the MEVShield Risk Engine.
* **The Graph:** Integrated as the historical/indexed data layer for MEVShield.
* **Arc RPC:** Used for current/live blockchain state and transaction operations.
* **Uniswap v4 Hook:** Provides the on-chain policy-enforcement boundary.
* **Settlement:** Settlement coordination and relayer components are integrated into the backend.
* **ENS:** ENS resolution remains an additional integration area and is not the primary risk-engine dependency.
* **Flashbots:** Flashbots functionality is not the core execution path for the Arc Testnet deployment.

### Data availability

The Graph depends on indexed on-chain events. Newly submitted transactions may not be immediately available through the subgraph.

For current state, the backend continues to use Arc RPC.

Therefore:

```text
Historical / Indexed
        ↓
     The Graph

Current / Live
        ↓
     Arc RPC
```

### Security model

The backend performs off-chain computation, but the final enforcement boundary remains on-chain.

Frontend signature recovery or backend risk results should not be treated as a substitute for Hook-level authorization and policy validation.

### Planned improvements

* Expand historical risk signals indexed by the MEVShield subgraph
* Increase historical pool/execution context used by the risk engine
* Add stronger multi-signal attack classification
* Expand automated integration and end-to-end tests
* Improve production observability and monitoring
* Add production-grade Arc/Circle settlement receipt tracking
* Strengthen TypeScript types across execution-policy payloads
* Add CI/CD validation for frontend, backend, Hook, and subgraph changes

---

# 🛡️ License

This project is licensed under the MIT License — see the [`LICENSE`](./LICENSE) file for details.
