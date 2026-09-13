# BlotChain-MEVShield Technical Specification

## 1. System Architecture Overview
BlotChain-MEVShield is structured as a decoupled, high-performance web3 security and visualization pipeline. The system separates mempool threat analysis from spatial data rendering to ensure zero-latency feedback loops for high-frequency traders and DeFi protocols.

```
+-------------------------------------------------------------+
|                     MEVShield Backend                       |
|   (Mempool Intent Monitoring & Threat Detection Engine)     |
+------------------------------+------------------------------+
                               | Real-Time Stream (JSON)
                               v
+-------------------------------------------------------------+
|                    Frontend Application                     |
|  +-----------------------+     +-------------------------+  |
|  |   React 18 Container  | --> | Three.js / WebGL Engine |  |
|  +-----------------------+     +-------------------------+  |
|  +-------------------------------------------------------+  |
|  |           HUD Overlay & ENS Resolver Module           |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

## 2. Core Data Schema: IntentThreatPayload
All telemetry and threat indicators are transmitted via a standardized JSON schema designed for low-overhead streaming.

```typescript
export type ThreatNodeType = 'WALLET' | 'DEX_POOL' | 'ROUTER' | 'VALIDATOR' | 'TRANSACTION' | 'CONTRACT';

export interface ThreatNode {
  id: string;
  label: string;
  type: ThreatNodeType;
  threatColor: string; // Hex color string (e.g., #22c55e for safe, #FF0055 for critical)
  isPulsing: boolean;  // Triggers high-frequency pulse animation when true
}

export interface RiskAssessment {
  riskScore: number;         // Float between 0.0 and 1.0
  detectedThreats: string[]; // Array of vectors (e.g., ['SANDWICH_ATTACK', 'FRONT_RUNNING'])
  actionTaken: string;       // Mitigation routine executed (e.g., 'Flashbots relay health monitored (rerouting planned)')
}

export interface IntentThreatPayload {
  timestamp: number;
  userAddress: string;
  ensName?: string;
  visualization: {
    nodes: ThreatNode[];
  };
  riskAssessment: RiskAssessment;
}
```

## 3. Frontend Visualization Architecture (ThreatVisualizer3D)
The 3D rendering pipeline is built on Three.js and WebGL, engineered to handle continuous data streams without memory leaks or frame drops.

### Lifecycle Management
- **Single-Mount Initialization:** The Three.js scene, camera, renderer, and lighting setup execute exactly once upon component mounting, managed via immutable `useRef` hooks.
- **Granular DOM Updates:** Incoming payloads update a targeted `THREE.Group` containing the nodes rather than re-instantiating the rendering context.
- **Resize Resilience:** Container dimensions are dynamically tracked using a native `ResizeObserver` to maintain aspect ratios during layout shifts.

### Visual State Engine
- **Stable State (`riskScore < 0.7`):** Nodes render as smooth, breathing spheres (`#22c55e`, scale oscillation ±3%).
- **Critical State (`riskScore >= 0.7`):** Nodes transition to neon red (`#FF0055`), scaling frequency increases 4x, and emissive intensity pulses rhythmically.

## 4. Performance & Scalability Benchmarks
- **Target Frame Rate:** Stable 60 FPS under continuous payload streaming.
- **Memory Management:** Explicit WebGL buffer disposal (`renderer.dispose()`) and event listener cleanup on unmount.
- **Component Optimization:** Wrapped in `React.memo` to eliminate redundant parent re-renders.
