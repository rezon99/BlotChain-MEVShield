export interface Node {
  id: string;
  name: string;
  category: string;
  price: number;
  liquidity: number;
  change24h: number;
  change7d: number;
  x: number;
  y: number;
  size: number;
  color: string;
  isSelected: boolean;
  lastUpdated: number;
  // NFT specific
  isHub?: boolean;
  volume24h?: number;
  image?: string;
  sparkline?: number[];
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  flow: number;
  direction: 'in' | 'out';
  particles: Particle[];
}

export interface Particle {
  id: string;
  progress: number;
  speed: number;
  size: number;
}

export interface TooltipData {
  node: Node;
  x: number;
  y: number;
  visible: boolean;
}

export interface AnimationSettings {
  enabled: boolean;
  particleSpeed: number;
  breathingIntensity: number;
}

export type DashboardMode = 'crypto' | 'nft';