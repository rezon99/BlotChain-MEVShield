/**
 * BlotChain-MEVShield: Backend Adapter & Multi-Tier Failover Chain
 * ETHOnline 2026 (Continuity Track)
 *
 * Provides a 3-tier resilient failover chain for risk evaluation:
 *   1. Primary: Partner live backend (The Graph + Uniswap v4 Hook)
 *   2. Secondary: Deployed cloud microservice backend (Render/Railway/Vercel)
 *   3. Tertiary: Local client-side simulation (100% UI availability guarantee)
 */

import { IntentThreatPayload, ThreatNode } from '../types/mev';
import { verifyEip712Signature } from '../utils/verifySignature';

// ---- Shapes coming from the backend ----

export interface SignedRiskPayload {
  poolId: string;
  expectedLpLoss: number;
  expectedLeakage: number;
  toxicityScore: number;      // integer, scaled x10000 by PayloadBuilder
  recommendedSpread: number;
  settlementToken: string;
  settlementAmount: number;
  destinationDomain: number;
  recipient: string;
  expiry: number;
  nonce: number;
  signer: string;
}

export interface SwapAnalyzeResponse {
  status: 'signed' | 'submitted' | 'failed';
  settlementId: string;
  payload: SignedRiskPayload;
  signature: string;
  txHash: string | null;
  settlementStatus: string;
}

export interface SwapEvent {
  id: string;
  sender: string;
  pool: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  minAmountOut: number;
  settlementId: string;
  signature: {
    payload: SignedRiskPayload;
    signature: string;
    isValid: boolean;
  };
  status: string;
  timestamp: number;
  txHash: string;
}

export interface FetchSwapEventsResult {
  success: boolean;
  data: SwapEvent[];
  timestamp: number;
}

export type FailoverSource = 'partner' | 'cloud' | 'local';

// ---- Helpers ----

const SAFE_COLOR = '#22c55e';
const WARN_COLOR = '#f97316';
const CRITICAL_COLOR = '#FF0055';

/** toxicityScore is stored x10000 on the backend (0.28 -> 2800) */
function toxicityToRiskScore(toxicityScore: number): number {
  const normalized = toxicityScore / 10000;
  return Math.max(0, Math.min(1, normalized));
}

function colorForRisk(riskScore: number): string {
  if (riskScore >= 0.7) return CRITICAL_COLOR;
  if (riskScore >= 0.4) return WARN_COLOR;
  return SAFE_COLOR;
}

function detectedThreatsFromRisk(riskScore: number, recommendedSpread: number): string[] {
  const threats: string[] = [];
  if (riskScore >= 0.7) threats.push('SANDWICH_ATTACK');
  if (riskScore >= 0.4) threats.push('TOXIC_FLOW');
  if (recommendedSpread > 0) threats.push('SLIPPAGE_EXPLOIT');
  return threats;
}

function short(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Converts one SwapEvent into the node graph the 3D visualizer expects.
 */
export function mapSwapEventToIntentThreatPayload(
  event: SwapEvent,
  ensNames?: Partial<Record<string, string>>
): IntentThreatPayload {
  const riskPayload = event.signature.payload;
  const riskScore = toxicityToRiskScore(riskPayload.toxicityScore);
  const isCritical = riskScore >= 0.7;
  const color = colorForRisk(riskScore);

  const verification = verifyEip712Signature(riskPayload, event.signature.signature);
  const signatureValid = verification.valid;
  const signatureReason = verification.reason;

  const senderEns = ensNames?.[event.sender];

  const nodes: ThreatNode[] = [
    {
      id: `wallet_${event.id}`,
      label: senderEns ?? short(event.sender),
      type: 'WALLET',
      threatColor: SAFE_COLOR,
      isPulsing: false,
      details: {
        address: event.sender,
        ensName: senderEns,
        role: 'victim',
        valueEth: event.amountIn,
        intentType: `SWAP_${event.tokenIn}_FOR_${event.tokenOut}`,
        status: event.status
      }
    },
    {
      id: `pool_${event.pool}`,
      label: `Pool ${event.pool}`,
      type: 'DEX_POOL',
      threatColor: color,
      isPulsing: isCritical,
      details: {
        address: riskPayload.poolId,
        role: 'pool',
        status: `Toxicity ${(riskScore * 100).toFixed(0)}% · spread ${riskPayload.recommendedSpread}bps`
      }
    },
    {
      id: `settlement_${event.settlementId}`,
      label: `Settlement (${riskPayload.settlementToken})`,
      type: 'CONTRACT',
      threatColor: signatureValid ? SAFE_COLOR : CRITICAL_COLOR,
      isPulsing: !signatureValid,
      details: {
        address: event.settlementId,
        protectionFeeUsdc: riskPayload.settlementAmount,
        status: signatureValid ? 'Policy Verified' : 'Signature Invalid',
        signatureValid,
        signatureReason
      }
    }
  ];

  return {
    timestamp: event.timestamp,
    userAddress: event.sender,
    ensName: senderEns,
    visualization: { nodes },
    riskAssessment: {
      riskScore,
      detectedThreats: detectedThreatsFromRisk(riskScore, riskPayload.recommendedSpread),
      actionTaken: signatureValid
        ? 'Policy signed & verified via Risk Engine'
        : 'Rejected — invalid attestation',
      signatureValid,
      signatureReason
    },
    meta: {
      attackVector: isCritical ? 'SANDWICH' : undefined
    }
  };
}

/** Same mapping starting from a single /swap/analyze response. */
export function mapAnalyzeResponseToIntentThreatPayload(
  response: SwapAnalyzeResponse,
  sender: string,
  pool: string,
  ensNames?: Partial<Record<string, string>>
): IntentThreatPayload {
  const pseudoEvent: SwapEvent = {
    id: response.settlementId,
    sender,
    pool,
    tokenIn: '',
    tokenOut: '',
    amountIn: 0,
    minAmountOut: 0,
    settlementId: response.settlementId,
    signature: {
      payload: response.payload,
      signature: response.signature,
      isValid: response.status !== 'failed'
    },
    status: response.settlementStatus,
    timestamp: Date.now(),
    txHash: response.txHash ?? ''
  };
  return mapSwapEventToIntentThreatPayload(pseudoEvent, ensNames);
}

/** Local client-side simulation payload fallback */
export function getLocalSimulatedPayload(userAddress?: string): IntentThreatPayload {
  const addr = userAddress || '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f';
  return {
    timestamp: Date.now(),
    userAddress: addr,
    ensName: 'trader.eth',
    visualization: {
      nodes: [
        {
          id: `wallet_sim_${Date.now()}`,
          label: 'Trader Wallet (trader.eth)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: addr,
            ensName: 'trader.eth',
            role: 'victim',
            valueEth: 12.5,
            intentType: 'SWAP_ETH_FOR_USDC',
            status: 'Protected via Client Simulation'
          }
        },
        {
          id: 'pool_simulated',
          label: 'Uniswap V3 ETH/USDC Pool',
          type: 'DEX_POOL',
          threatColor: '#f97316',
          isPulsing: false,
          details: {
            address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
            role: 'pool',
            status: 'Local Client Simulation Active'
          }
        }
      ]
    },
    riskAssessment: {
      riskScore: 0.12,
      detectedThreats: [],
      actionTaken: 'Protected via Local Client Simulation Guard'
    },
    meta: {
      attackVector: 'SAFE_FLOW',
      protectionFeeUsdc: 0.15
    }
  };
}

// ---- Multi-Tier Failover Chain (Cloud Fallback) ----

/**
 * Executes 3-tier failover chain for risk evaluation:
 *   1. Primary: Partner backend (`/swap/analyze` or `/api/analyze`)
 *   2. Secondary: Deployed cloud backend (`/swap/analyze` or `/api/analyze`)
 *   3. Tertiary: Local client simulation
 */
export async function getMevRiskData(payload: Record<string, unknown>): Promise<unknown> {
  const partnerUrl = (import.meta.env.VITE_PARTNER_BACKEND_URL as string || '').replace(/\/$/, '');
  const cloudUrl = (
    import.meta.env.VITE_MY_DEPLOYED_BACKEND_URL as string ||
    import.meta.env.VITE_RISK_ENGINE_BACKEND_URL as string ||
    ''
  ).replace(/\/$/, '');

  // 1. First attempt: Primary Partner Backend (The Graph + v4 Hook)
  if (partnerUrl) {
    try {
      let res = await fetch(`${partnerUrl}/swap/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch(`${partnerUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Partner backend failed, switching to secondary cloud backend', e);
    }
  }

  // 2. Second attempt: Deployed Cloud Backend
  if (cloudUrl) {
    try {
      let res = await fetch(`${cloudUrl}/swap/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch(`${cloudUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Secondary cloud backend failed, using local client simulation', e);
    }
  }

  // 3. Third attempt: Local Client Simulation (100% guarantee of UI function)
  const userAddress = typeof payload?.userAddress === 'string' ? payload.userAddress : undefined;
  return getLocalSimulatedPayload(userAddress);
}

export interface LiveThreatFetchResult {
  payloads: IntentThreatPayload[];
  activeSource: FailoverSource;
}

/**
 * Polls live swap events using the 3-tier Failover Chain:
 *   1. Primary: Partner backend
 *   2. Secondary: Deployed cloud backend
 *   3. Tertiary: Local simulation
 */
export async function fetchLiveThreatPayloads(
  primaryUrl?: string,
  secondaryUrl?: string,
  ensNames?: Partial<Record<string, string>>
): Promise<LiveThreatFetchResult> {
  const partnerUrl = (primaryUrl || import.meta.env.VITE_PARTNER_BACKEND_URL || '').trim().replace(/\/$/, '');
  const cloudUrl = (
    secondaryUrl ||
    import.meta.env.VITE_MY_DEPLOYED_BACKEND_URL ||
    import.meta.env.VITE_RISK_ENGINE_BACKEND_URL ||
    ''
  ).trim().replace(/\/$/, '');

  // 1. Attempt Primary Partner Backend
  if (partnerUrl) {
    try {
      const res = await fetch(`${partnerUrl}/api/swaps/events`);
      if (res.ok) {
        const json: FetchSwapEventsResult = await res.json();
        if (json.success && json.data.length > 0) {
          return {
            payloads: json.data.map((event) => mapSwapEventToIntentThreatPayload(event, ensNames)),
            activeSource: 'partner'
          };
        }
      }
    } catch (err) {
      console.warn('Partner backend events stream failed, switching to secondary cloud backend', err);
    }
  }

  // 2. Attempt Secondary Deployed Cloud Microservice Backend
  if (cloudUrl) {
    try {
      const res = await fetch(`${cloudUrl}/api/swaps/events`);
      if (res.ok) {
        const json: FetchSwapEventsResult = await res.json();
        if (json.success && json.data.length > 0) {
          return {
            payloads: json.data.map((event) => mapSwapEventToIntentThreatPayload(event, ensNames)),
            activeSource: 'cloud'
          };
        }
      }
    } catch (err) {
      console.warn('Secondary cloud backend events stream failed, using local client simulation', err);
    }
  }

  // 3. Tertiary Client Simulation Fallback
  return {
    payloads: [getLocalSimulatedPayload()],
    activeSource: 'local'
  };
}
