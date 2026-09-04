export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DetectedThreat = 'SANDWICH_ATTACK' | 'FRONTRUNNING' | 'SLIPPAGE_EXPLOIT' | 'NONE';
export type ExecutionStatus = 'PENDING' | 'PROTECTED_AND_EXECUTED' | 'EXPOSED_PUBLIC_MEMPOOL';

export interface ThreatNode {
  id: string;
  label: string;
  type: 'WALLET' | 'DEX_POOL' | 'PRIVATE_ROUTER' | 'MEMPOOL_ATTACKER';
  threatColor: string;
  isPulsing: boolean;
}

export interface ThreatFlow {
  fromNodeId: string;
  toNodeId: string;
  volumeUsd: number;
  particleColor: string;
  particleSpeed: number;
}

export interface IntentThreatPayload {
  intentId: string;
  timestamp: number;
  userAddress: string;
  status: ExecutionStatus;
  riskAssessment: {
    riskScore: number; // 0.0 - 1.0
    threatLevel: ThreatLevel;
    detectedThreats: DetectedThreat[];
    actionTaken: string;
  };
  visualization: {
    nodes: ThreatNode[];
    flows: ThreatFlow[];
  };
}
