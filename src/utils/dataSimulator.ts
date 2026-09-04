import { Node, Connection } from '../types';
import { getNodeColor, generateParticles } from './visuals';

const CRYPTO_PROJECTS = [
  { name: 'Bitcoin', category: 'Layer 1', baseFlow: 2500000000 },
  { name: 'Ethereum', category: 'Layer 1', baseFlow: 1800000000 },
  { name: 'Binance Coin', category: 'Exchange', baseFlow: 900000000 },
  { name: 'Cardano', category: 'Layer 1', baseFlow: 450000000 },
  { name: 'Solana', category: 'Layer 1', baseFlow: 380000000 },
  { name: 'Polkadot', category: 'Layer 0', baseFlow: 320000000 },
  { name: 'Avalanche', category: 'Layer 1', baseFlow: 280000000 },
  { name: 'Chainlink', category: 'Oracle', baseFlow: 250000000 },
  { name: 'Polygon', category: 'Layer 2', baseFlow: 180000000 },
  { name: 'Uniswap', category: 'DEX', baseFlow: 150000000 }
];

export function generateMockNodes(): Node[] {
  return CRYPTO_PROJECTS.map((project, index) => {
    const angle = (index * 2 * Math.PI) / CRYPTO_PROJECTS.length;
    const radius = 200 + Math.random() * 100;
    const change24h = (Math.random() - 0.5) * 30;
    const change7d = (Math.random() - 0.5) * 60;
    const liquidity = project.baseFlow * (0.8 + Math.random() * 0.4);
    
    return {
      id: project.name.toLowerCase().replace(' ', '-'),
      name: project.name,
      category: project.category,
      liquidity,
      change24h,
      change7d,
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius,
      size: Math.max(30, Math.min(120, liquidity / 15000000)),
      color: getNodeColor(change24h, change7d),
      isSelected: false,
      lastUpdated: Date.now()
    };
  });
}

export function generateMockConnections(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  const connectionCount = Math.min(15, nodes.length * 2);
  
  for (let i = 0; i < connectionCount; i++) {
    const sourceIndex = Math.floor(Math.random() * nodes.length);
    let targetIndex = Math.floor(Math.random() * nodes.length);
    
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * nodes.length);
    }
    
    const source = nodes[sourceIndex];
    const target = nodes[targetIndex];
    const flow = Math.random() * 50000000 + 5000000;
    
    connections.push({
      id: `${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
      flow,
      direction: Math.random() > 0.5 ? 'in' : 'out',
      particles: generateParticles(3)
    });
  }
  
  return connections;
}

