import { Node, Connection } from '../types';
import { CoinMarketData, ExchangeData, NFTMarketData } from '../services/coinGeckoApi';
import { calculateNodeSize, getNodeColor, generateParticles } from './visuals';

export interface ViewportConfig {
  width: number;
  height: number;
  padding: number;
}

export function getResponsiveViewport(width: number, height: number): ViewportConfig {
  const safeWidth = Math.max(320, Math.floor(width || 800));
  const safeHeight = Math.max(320, Math.floor(height || 600));
  const isMobile = safeWidth <= 640;
  const padding = isMobile ? 18 : 28;

  return {
    width: safeWidth,
    height: safeHeight,
    padding
  };
}

function generateConcentricPositions(
  count: number,
  viewport: ViewportConfig
): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  if (count === 1) return [{ x: viewport.width / 2, y: viewport.height / 2 }];

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const padding = viewport.padding || 28;

  // Maximize span across both width and height to fill the entire screen
  const rxMax = Math.max(60, centerX - padding - 35);
  const ryMax = Math.max(60, centerY - padding - 35);

  const positions: Array<{ x: number; y: number }> = [];
  // Vogel golden angle distribution across full elliptical/rectangular viewport
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5077 degrees

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      positions.push({ x: centerX, y: centerY });
      continue;
    }

    // Spread factor from 0.25 to 0.98 to cover the whole screen space
    const ratio = Math.sqrt(i / (count - 0.5));
    const spread = 0.25 + 0.73 * ratio;

    const angle = i * goldenAngle;
    const x = centerX + Math.cos(angle) * (rxMax * spread);
    const y = centerY + Math.sin(angle) * (ryMax * spread);

    positions.push({ x, y });
  }

  return positions;
}

export function adaptNodesToViewport(
  nodes: Node[],
  width: number,
  height: number
): Node[] {
  if (nodes.length === 0) return nodes;

  const viewport = getResponsiveViewport(width, height);
  const positions = generateConcentricPositions(nodes.length, viewport);

  return nodes.map((node, index) => ({
    ...node,
    x: positions[index]?.x ?? viewport.width / 2,
    y: positions[index]?.y ?? viewport.height / 2,
    size: calculateNodeSize(node.liquidity, viewport.width, Boolean(node.isHub))
  }));
}

export function transformCoinDataToNodes(
  coinData: CoinMarketData[], 
  exchangeData: ExchangeData[] = [],
  viewport: ViewportConfig = getResponsiveViewport(800, 600)
): Node[] {
  const allData = [
    ...coinData.map(coin => ({
      ...coin,
      type: 'coin' as const,
      volume: coin.total_volume
    })),
    ...exchangeData.map(exchange => ({
      id: exchange.id,
      name: exchange.name,
      symbol: exchange.id,
      current_price: 0,
      market_cap: exchange.trade_volume_24h_btc * 50000, // Approximate USD value
      market_cap_rank: exchange.trust_score_rank,
      price_change_percentage_24h: (exchange.trust_score - 5) * 2, // Simulate change
      price_change_percentage_7d_in_currency: (exchange.trust_score - 5) * 4,
      total_volume: exchange.trade_volume_24h_btc * 50000,
      circulating_supply: 0,
      type: 'exchange' as const,
      volume: exchange.trade_volume_24h_btc * 50000
    }))
  ];

  const positions = generateConcentricPositions(allData.length, viewport);

  const mappedNodes = allData.map((item, index) => {
    
    // Calculate liquidity based on market cap and volume with safety checks
    const marketCap = item.market_cap || 0;
    const totalVolume = item.total_volume || 0;
    const liquidity = item.type === 'coin' 
      ? marketCap + totalVolume
      : item.volume || 0;
    
    // Determine category
    const category = item.type === 'exchange' 
      ? 'CEX'
      : getCoinCategory(item.name || 'Unknown', item.symbol || '', item.market_cap_rank || 999);

    return {
      id: item.id || `unknown-${index}`,
      name: item.name || 'Unknown Asset',
      category,
      price: item.current_price || 0,
      liquidity,
      change24h: item.price_change_percentage_24h ?? 0,
      change7d: item.price_change_percentage_7d_in_currency ?? 0,
      x: positions[index]?.x ?? viewport.width / 2,
      y: positions[index]?.y ?? viewport.height / 2,
      size: calculateNodeSize(liquidity, viewport.width, false),
      color: getNodeColor(
        item.price_change_percentage_24h ?? 0,
        item.price_change_percentage_7d_in_currency ?? 0
      ),
      isSelected: false,
      lastUpdated: Date.now(),
      sparkline: item.sparkline_in_7d?.price
    };
  });

  return mappedNodes;
}

export function generateConnectionsFromRealData(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  
  // Create connections based on market relationships
  const cexs = nodes.filter(n => n.category === 'CEX');
  const top10 = nodes.filter(n => n.category === 'Top 10');
  const amms = nodes.filter(n => n.category === 'AMM / DEX' || n.category === 'Protocols / Altcoins');
  
  // Connect centralized exchanges to Top 10 coins
  cexs.forEach(cex => {
    top10.slice(0, 3).forEach(coin => {
      if (Math.random() > 0.3) { // 70% chance of connection
        connections.push(createConnection(cex, coin));
      }
    });
  });
  
  // Connect AMMs/Protocols to Top 10 coins
  amms.forEach(amm => {
    const randomTop10 = top10[Math.floor(Math.random() * top10.length)];
    if (randomTop10) {
      connections.push(createConnection(amm, randomTop10));
    }
  });
  
  // Add some random connections for network effect
  for (let i = 0; i < Math.min(10, nodes.length); i++) {
    const source = nodes[Math.floor(Math.random() * nodes.length)];
    const target = nodes[Math.floor(Math.random() * nodes.length)];

    if (source.id !== target.id && !connections.find(c =>
      (c.source === source.id && c.target === target.id) ||
      (c.source === target.id && c.target === source.id)
    )) {
      connections.push(createConnection(source, target));
    }
  }
  
  return connections;
}

function createConnection(source: Node, target: Node): Connection {
  const flow = Math.min(source.liquidity, target.liquidity) * (0.1 + Math.random() * 0.3);
  
  return {
    id: `${source.id}-${target.id}`,
    source: source.id,
    target: target.id,
    flow,
    direction: source.liquidity > target.liquidity ? 'out' : 'in',
    particles: generateParticles(Math.min(5, Math.max(1, Math.floor(flow / 50000000))))
  };
}

export function transformNFTDataToNodes(
  nftData: NFTMarketData[],
  viewport: ViewportConfig = getResponsiveViewport(800, 600)
): Node[] {
  const nodes: Node[] = [];
  const platforms = Array.from(new Set(nftData.map(nft => nft.asset_platform_id)));

  // Create platform hub nodes
  const platformHubs: Record<string, Node> = {};
  const hubPositions = generateConcentricPositions(Math.max(platforms.length, 1), {
    ...viewport,
    padding: viewport.padding + 20
  });
  platforms.forEach((platform, index) => {
    const hubNode: Node = {
      id: `hub-${platform}`,
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      category: 'Blockchain',
      price: 0,
      liquidity: 0,
      change24h: 0,
      change7d: 0,
      x: hubPositions[index]?.x ?? viewport.width / 2,
      y: hubPositions[index]?.y ?? viewport.height / 2,
      size: calculateNodeSize(0, viewport.width, true),
      color: '#3b82f6',
      isSelected: false,
      lastUpdated: Date.now(),
      isHub: true
    };
    platformHubs[platform] = hubNode;
    nodes.push(hubNode);
  });

  // Create NFT collection nodes
  nftData.forEach((nft) => {
    const hub = platformHubs[nft.asset_platform_id];
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.max(55, Math.min(140, Math.min(viewport.width, viewport.height) * 0.18));

    nodes.push({
      id: nft.id,
      name: nft.name,
      category: nft.asset_platform_id,
      price: nft.floor_price.usd,
      liquidity: nft.market_cap.usd,
      change24h: nft.floor_price_in_usd_24h_percentage_change,
      change7d: 0, // Not available in simple market data
      x: hub.x + Math.cos(angle) * distance,
      y: hub.y + Math.sin(angle) * distance,
      size: calculateNodeSize(nft.market_cap.usd, viewport.width, false),
      color: getNodeColor(nft.floor_price_in_usd_24h_percentage_change, 0),
      isSelected: false,
      lastUpdated: Date.now(),
      volume24h: nft.volume_24h.usd,
      image: nft.image.small
    });
  });

  return nodes;
}

export function generateNFTConnections(nodes: Node[]): Connection[] {
  const connections: Connection[] = [];
  const hubs = nodes.filter(n => n.isHub);
  const collections = nodes.filter(n => !n.isHub);

  collections.forEach(collection => {
    const hub = hubs.find(h => h.id === `hub-${collection.category}`);
    if (hub) {
      connections.push({
        id: `${hub.id}-${collection.id}`,
        source: hub.id,
        target: collection.id,
        flow: collection.volume24h || 0,
        direction: 'out',
        particles: generateParticles(Math.min(5, Math.max(1, Math.floor((collection.volume24h || 0) / 100000))))
      });
    }
  });

  return connections;
}

function getCoinCategory(name: string, symbol: string, rank: number): string {
  const name_lower = name.toLowerCase();
  const sym_lower = symbol.toLowerCase();
  
  // 1. Stablecoins
  const isStable = [
    'usdt', 'usdc', 'dai', 'fdusd', 'usde', 'usds', 'tusd', 'busd', 'ust', 'mim', 'frax'
  ].includes(sym_lower) || name_lower.includes('tether') || name_lower.includes('usd coin') || name_lower.includes('stablecoin') || name_lower.includes('dollar');

  if (isStable) {
    return 'Stablecoins';
  }

  // 2. Top 10
  if (rank <= 10) {
    return 'Top 10';
  }

  // 3. AMM / DEX
  const isAMM = name_lower.includes('uniswap') || name_lower.includes('curve') ||
                name_lower.includes('pancake') || name_lower.includes('sushi') ||
                name_lower.includes('balancer') || name_lower.includes('bancor') ||
                name_lower.includes('thorchain') || sym_lower === 'uni' || sym_lower === 'cake' || sym_lower === 'crv';
  if (isAMM) {
    return 'AMM / DEX';
  }

  // 4. Protocols / Altcoins
  return 'Protocols / Altcoins';
}
