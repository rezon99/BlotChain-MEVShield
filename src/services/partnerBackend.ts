/**
 * BlotChain-MEVShield: Backend Adapter
 * ETHOnline 2026 (Continuity Track)
 *
 * Bridges the IsholaAtotimati/Uniswap_Mev risk-engine backend
 * (SignedRiskPayload / swap/analyze response shape) to the
 * frontend's IntentThreatPayload used by ThreatVisualizer3D.
 *
 * Backend reference:
 *   POST /swap/analyze   -> { status, settlementId, payload, signature, txHash, settlementStatus }
 *   POST /api/analyze    -> { riskScore, toxicity, recommendedSpread, feePercent, pool, riskLevel, ... }
 *   GET  /api/swaps/events -> { success, data: SwapEvent[] }
 */

import { IntentThreatPayload, ThreatNode } from '../types/mev';

// ---- Shapes coming from the backend (babackend/src) ----

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
 * Converts one SwapEvent (as returned by GET /api/swaps/events, or the
 * payload of a single POST /swap/analyze call) into the node graph the
 * 3D visualizer expects.
 *
 * ensNameResolver is optional — pass EnsService.resolve/batchResolve
 * results here if you already fetched them, otherwise raw addresses
 * are shown and ThreatVisualizer3D / EnsService can resolve lazily.
 */
export function mapSwapEventToIntentThreatPayload(
  event: SwapEvent,
  ensNames?: Partial<Record<string, string>>
): IntentThreatPayload {
  const riskPayload = event.signature.payload;
  const riskScore = toxicityToRiskScore(riskPayload.toxicityScore);
  const isCritical = riskScore >= 0.7;
  const color = colorForRisk(riskScore);

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
      threatColor: event.signature.isValid ? SAFE_COLOR : CRITICAL_COLOR,
      isPulsing: !event.signature.isValid,
      details: {
        address: event.settlementId,
        protectionFeeUsdc: riskPayload.settlementAmount,
        status: event.signature.isValid ? 'Policy Verified' : 'Signature Invalid'
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
      actionTaken: event.signature.isValid
        ? 'Policy signed & enforced via Uniswap v4 Hook'
        : 'Rejected — invalid attestation'
    },
    meta: {
      attackVector: isCritical ? 'SANDWICH' : undefined
    }
  };
}

/** Same mapping, starting from a single /swap/analyze response instead of a list item. */
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

// ---- Polling hook-friendly fetcher (use inside useRealTimeData-style hook) ----

export interface FetchSwapEventsResult {
  success: boolean;
  data: SwapEvent[];
  timestamp: number;
}

/**
 * Polls GET {backendBaseUrl}/api/swaps/events and returns ready-to-render
 * IntentThreatPayload objects. Call this on an interval (e.g. every 2500ms)
 * from ThreatDashboard instead of ATTACK_SCENARIOS.
 */
export async function fetchLiveThreatPayloads(
  backendBaseUrl: string,
  ensNames?: Partial<Record<string, string>>
): Promise<IntentThreatPayload[]> {
  const res = await fetch(`${backendBaseUrl.replace(/\/$/, '')}/api/swaps/events`);
  if (!res.ok) {
    throw new Error(`MEVShield backend returned ${res.status}`);
  }
  const json: FetchSwapEventsResult = await res.json();
  if (!json.success) return [];
  return json.data.map((event) => mapSwapEventToIntentThreatPayload(event, ensNames));
}
