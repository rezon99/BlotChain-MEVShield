export interface ThreatNode {
  id: string;
  label: string;
  type: 'WALLET' | 'DEX_POOL' | 'TRANSACTION' | 'CONTRACT' | string;
  threatColor?: string;    // hex color (e.g., '#ef4444')
  isPulsing?: boolean;    // high-risk nodes will pulse faster
  details?: {
    address?: string;
    gasPriceGwei?: number;
    valueEth?: number;
    minerBribeEth?: number;
    slippageTolerance?: number;
    intentType?: string;
    role?: 'victim' | 'attacker' | 'mempool' | 'pool' | 'searcher' | 'target';
    status?: string;
  };
}

export interface IntentThreatPayload {
  visualization?: {
    nodes: ThreatNode[];
  };
  riskAssessment?: {
    riskScore: number;
    detectedThreats: string[];
    actionTaken?: string;
  };
  meta?: {
    blockNumber?: number;
    timestamp?: string;
    attackVector?: 'SANDWICH' | 'FRONTRUN' | 'LIQUIDITY_DRAIN' | 'JIT_LIQUIDITY' | 'SLIPPAGE_EXPLOIT' | string;
    estimatedLossUsd?: number;
    targetPair?: string;
  };
}

export type ThreatAttackType = 'SANDWICH' | 'FRONTRUN' | 'JIT_LIQUIDITY' | 'SLIPPAGE' | 'NORMAL';
