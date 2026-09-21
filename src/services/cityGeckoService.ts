const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
const BASE_URL = import.meta.env.VITE_COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';

export interface CityCoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  circulating_supply: number;
  image?: string;
  district: 'Mega-Cap' | 'Top 50' | 'Top 100' | 'Top 250' | 'Top 500';
  height: number; // calculated 3D skyscraper height (units)
  color: string; // HEX color based on 24h gain/loss
}

// Well-known crypto fallbacks for top ranks to ensure smooth offline or rate-limited presentation
const FAMOUS_TOKENS = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', price: 68500, cap: 1350000000000, change: 3.45 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', price: 2850, cap: 342000000000, change: 2.12 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', price: 1.0, cap: 118000000000, change: 0.02 },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', price: 580, cap: 85000000000, change: -1.15 },
  { id: 'solana', symbol: 'sol', name: 'Solana', price: 145, cap: 68000000000, change: 6.80 },
  { id: 'usd-coin', symbol: 'usdc', name: 'USDC', price: 1.0, cap: 35000000000, change: 0.01 },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', price: 0.54, cap: 30000000000, change: -2.40 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', price: 0.35, cap: 12500000000, change: 1.85 },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', price: 28.5, cap: 11200000000, change: 4.30 },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', price: 0.12, cap: 17500000000, change: -3.80 },
  { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu', price: 0.000018, cap: 10500000000, change: 0.95 },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', price: 4.8, cap: 6800000000, change: -0.85 },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', price: 11.5, cap: 6900000000, change: 5.10 },
  { id: 'near', symbol: 'near', name: 'NEAR Protocol', price: 4.2, cap: 4800000000, change: 8.20 },
  { id: 'sui', symbol: 'sui', name: 'Sui', price: 1.85, cap: 5100000000, change: 12.40 },
  { id: 'pepe', symbol: 'pepe', name: 'Pepe', price: 0.0000095, cap: 4000000000, change: -6.50 },
  { id: 'uniswap', symbol: 'uni', name: 'Uniswap', price: 6.8, cap: 4100000000, change: 1.25 },
  { id: 'aptos', symbol: 'apt', name: 'Aptos', price: 8.4, cap: 3900000000, change: 3.60 },
  { id: 'polygon-ecosystem-token', symbol: 'pol', name: 'Polygon POL', price: 0.38, cap: 2900000000, change: -1.90 },
  { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', price: 68.0, cap: 5100000000, change: 0.45 },
];

class CityGeckoService {
  private cache: { data: CityCoinData[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 45000; // 45s cache

  private calculateHeight(marketCap: number, rank: number): number {
    // Logarithmic scale for heights so Mega-Caps (e.g. BTC ~1.3T) stand out as tall landmarks
    // while smaller coins (ranks 100-500) still have distinct readable heights.
    if (!marketCap || marketCap <= 0) {
      return Math.max(6, 40 - Math.log2(rank + 1));
    }
    const logCap = Math.log10(marketCap); // e.g. 12.1 for 1.3T, 8.0 for 100M
    const height = Math.pow(Math.max(1, logCap - 5), 2.2) * 2.8 + 8;
    return Math.min(180, Math.max(6, height));
  }

  private calculateColor(change24h: number): string {
    if (change24h >= 10.0) return '#10b981'; // Emerald 500 (Massive gain)
    if (change24h >= 4.0) return '#22c55e';  // Green 500 (Strong gain)
    if (change24h >= 0.0) return '#4ade80';  // Green 400 (Mild gain)
    if (change24h >= -4.0) return '#f87171'; // Red 400 (Mild loss)
    if (change24h >= -10.0) return '#ef4444'; // Red 500 (Strong loss)
    return '#dc2626';                       // Red 600 (Massive drop)
  }

  private assignDistrict(rank: number): CityCoinData['district'] {
    if (rank <= 10) return 'Mega-Cap';
    if (rank <= 50) return 'Top 50';
    if (rank <= 100) return 'Top 100';
    if (rank <= 250) return 'Top 250';
    return 'Top 500';
  }

  /**
   * Fetches the top list of crypto coins from CoinGecko API up to `requestedCount` (e.g., 250-500 coins).
   * Automatically handles page iteration, API limits, and fallback mock generation.
   */
  async getCityTopCoins(requestedCount: number = 300): Promise<CityCoinData[]> {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache.data;
    }

    try {
      const perPage = Math.min(250, requestedCount);
      const pagesToFetch = Math.ceil(requestedCount / perPage);
      const rawCoins: Array<{
        id: string;
        symbol: string;
        name: string;
        current_price: number;
        market_cap: number;
        market_cap_rank: number;
        price_change_percentage_24h: number;
        total_volume: number;
        circulating_supply: number;
        image?: string;
      }> = [];

      for (let page = 1; page <= pagesToFetch; page++) {
        const params = new URLSearchParams({
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: perPage.toString(),
          page: page.toString(),
          sparkline: 'false',
          price_change_percentage: '24h'
        });

        if (API_KEY) {
          const isPro = BASE_URL.includes('pro-api.coingecko.com');
          params.append(isPro ? 'x_cg_pro_api_key' : 'x_cg_demo_api_key', API_KEY);
        }

        const url = `${BASE_URL.replace(/\/+$/, '')}/coins/markets?${params.toString()}`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`CoinGecko response HTTP ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          rawCoins.push(...data);
        }
      }

      if (rawCoins.length > 0) {
        const result = rawCoins.slice(0, requestedCount).map((coin, index) => {
          const rank = coin.market_cap_rank || index + 1;
          const change = coin.price_change_percentage_24h || 0;
          const marketCap = coin.market_cap || (100000000000 / (rank + 1));

          return {
            id: coin.id,
            symbol: (coin.symbol || 'COIN').toUpperCase(),
            name: coin.name || 'Crypto Asset',
            current_price: coin.current_price || 1.0,
            market_cap: marketCap,
            market_cap_rank: rank,
            price_change_percentage_24h: change,
            total_volume: coin.total_volume || 10000000,
            circulating_supply: coin.circulating_supply || 1000000,
            image: coin.image,
            district: this.assignDistrict(rank),
            height: this.calculateHeight(marketCap, rank),
            color: this.calculateColor(change)
          };
        });

        this.cache = { data: result, timestamp: Date.now() };
        return result;
      }
    } catch (err) {
      console.warn('CoinGecko City API fetch failed, activating resilient simulation fallback:', err);
    }

    // Fallback simulation mode generating top `requestedCount` tokens seamlessly
    const fallbackList: CityCoinData[] = [];

    // First populate famous tokens
    FAMOUS_TOKENS.forEach((ft, idx) => {
      const rank = idx + 1;
      fallbackList.push({
        id: ft.id,
        symbol: ft.symbol.toUpperCase(),
        name: ft.name,
        current_price: ft.price,
        market_cap: ft.cap,
        market_cap_rank: rank,
        price_change_percentage_24h: ft.change,
        total_volume: ft.cap * 0.08,
        circulating_supply: ft.cap / ft.price,
        district: this.assignDistrict(rank),
        height: this.calculateHeight(ft.cap, rank),
        color: this.calculateColor(ft.change)
      });
    });

    // Dynamically generate remaining tokens up to requestedCount (e.g., 300)
    for (let rank = fallbackList.length + 1; rank <= requestedCount; rank++) {
      const baseCap = 15000000000 / Math.pow(rank, 1.15);
      const price = Math.max(0.01, 1000 / (rank + 2));
      const change = parseFloat(((Math.sin(rank * 1.7) * 8.5) + (Math.cos(rank * 0.9) * 2.5)).toFixed(2));
      const symbol = `TKN${rank}`;
      const name = `Asset #${rank}`;

      fallbackList.push({
        id: `sim-asset-${rank}`,
        symbol,
        name,
        current_price: parseFloat(price.toFixed(4)),
        market_cap: Math.round(baseCap),
        market_cap_rank: rank,
        price_change_percentage_24h: change,
        total_volume: Math.round(baseCap * 0.05),
        circulating_supply: Math.round(baseCap / price),
        district: this.assignDistrict(rank),
        height: this.calculateHeight(baseCap, rank),
        color: this.calculateColor(change)
      });
    }

    this.cache = { data: fallbackList, timestamp: Date.now() };
    return fallbackList;
  }
}

export const cityGeckoService = new CityGeckoService();
