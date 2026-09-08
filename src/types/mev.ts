export type ThreatNodeType = 'WALLET' | 'DEX_POOL' | 'ROUTER' | 'VALIDATOR' | 'TRANSACTION' | 'CONTRACT' | string;

export interface ThreatNode {
  id: string;
  label: string;
  type: ThreatNodeType;
  threatColor?: string;    // Hex color string (e.g., '#22c55e' for safe, '#FF0055' or '#ef4444' for critical)
  isPulsing?: boolean;    // Triggers high-frequency pulse animation when true
  details?: {
    address?: string;
    ensName?: string;
    gasPriceGwei?: number;
    valueEth?: number;
    minerBribeEth?: number;
    protectionFeeUsdc?: number;
    slippageTolerance?: number;
    intentType?: string;
    role?: 'victim' | 'attacker' | 'mempool' | 'pool' | 'searcher' | 'target';
    status?: string;
  };
}

export interface RiskAssessment {
  riskScore: number;         // Float between 0.0 and 1.0
  detectedThreats: string[]; // Array of vectors (e.g., ['SANDWICH_ATTACK', 'FRONT_RUNNING'])
  actionTaken?: string;      // Mitigation routine executed (e.g., 'Rerouted via Private RPC')
}

export interface IntentThreatPayload {
  timestamp?: number | string;
  userAddress?: string;
  ensName?: string;
  visualization?: {
    nodes: ThreatNode[];
  };
  riskAssessment?: RiskAssessment;
  meta?: {
    blockNumber?: number;
    timestamp?: string;
    attackVector?: 'SANDWICH' | 'FRONTRUN' | 'LIQUIDITY_DRAIN' | 'JIT_LIQUIDITY' | 'SLIPPAGE_EXPLOIT' | string;
    estimatedLossUsd?: number;
    targetPair?: string;
    protectionFeeUsdc?: number;
  };
}

export type ThreatAttackType = 'SANDWICH' | 'FRONTRUN' | 'JIT_LIQUIDITY' | 'SLIPPAGE' | 'NORMAL';
