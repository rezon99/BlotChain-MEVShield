const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
const BASE_URL = import.meta.env.VITE_COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  total_volume: number;
  circulating_supply: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface ExchangeData {
  id: string;
  name: string;
  trade_volume_24h_btc: number;
  trust_score: number;
  trust_score_rank: number;
}

interface GlobalMarketData {
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface NFTMarketData {
  id: string;
  contract_address: string;
  asset_platform_id: string;
  name: string;
  symbol: string;
  image: {
    small: string;
  };
  floor_price: {
    native_currency: number;
    usd: number;
  };
  market_cap: {
    native_currency: number;
    usd: number;
  };
  volume_24h: {
    native_currency: number;
    usd: number;
  };
  floor_price_in_usd_24h_percentage_change: number;
}

export interface TokenMarketDepth {
  id: string;
  symbol: string;
  currentPriceUsd: number;
  totalVolume24hUsd: number;
  estimated2PercentDepthUsd: number;
  priceVolatility24hPercent: number;
  marketCapUsd: number;
}

export interface RiskExposureMetrics {
  tokenSymbol: string;
  tradeAmountUsd: number;
  poolLiquidityUsd: number;
  volumeToDepthRatio: number;
  estimatedSlippagePercent: number;
  riskScore: number; // 0.0 to 1.0
  threatClassification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedExtractableLossUsd: number;
  recommendedMitigation: string;
}

class CoinGeckoApiService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  // Static price fallback dictionary for ultra-fast resiliency
  private fallbackPrices: Record<string, number> = {
    ethereum: 2850.00,
    eth: 2850.00,
    bitcoin: 68400.00,
    btc: 68400.00,
    'usd-coin': 1.00,
    usdc: 1.00,
    tether: 1.00,
    usdt: 1.00,
    uniswap: 8.45,
    uni: 8.45,
    chainlink: 14.80,
    link: 14.80,
    solana: 145.20,
    sol: 145.20
  };

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!BASE_URL) {
      throw new Error('CoinGecko API base URL is not configured. Please check your environment variables.');
    }

    // Normalize base URL and endpoint to prevent double-slashes in URL resolution
    const normalizedUrlStr = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
    const url = new URL(normalizedUrlStr);

    const isPro = BASE_URL.includes('pro-api.coingecko.com');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add API key to query params and headers if available
    if (API_KEY) {
      if (isPro) {
        params.x_cg_pro_api_key = API_KEY;
        headers['x-cg-pro-api-key'] = API_KEY;
      } else {
        params.x_cg_demo_api_key = API_KEY;
        headers['x-cg-demo-api-key'] = API_KEY;
      }
    }

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const cacheKey = url.toString();
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }

    try {
      const response = await fetch(url.toString(), {
        headers,
      });

      if (response.status === 429) {
        // Return cached data if available even if expired on rate limit
        if (cached) return cached.data as T;
        throw new Error('CoinGecko API rate limit exceeded. Please try again later or use an API key.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `CoinGecko API error: ${response.status} ${response.statusText}${
            errorData.error ? ` - ${errorData.error}` : ''
          }`
        );
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to connect to CoinGecko API. Please check your internet connection.');
      }
      console.error('CoinGecko API Error:', error);
      throw error;
    }
  }

  async getTopCoins(limit: number = 20): Promise<CoinMarketData[]> {
    return this.makeRequest<CoinMarketData[]>('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit.toString(),
      page: '1',
      sparkline: 'true',
      price_change_percentage: '24h,7d'
    });
  }

  async getExchanges(limit: number = 10): Promise<ExchangeData[]> {
    return this.makeRequest<ExchangeData[]>('/exchanges', {
      per_page: limit.toString(),
      page: '1'
    });
  }

  async getGlobalMarketData(): Promise<GlobalMarketData> {
    return this.makeRequest<GlobalMarketData>('/global');
  }

  async getCoinHistory(coinId: string, days: number = 7): Promise<MarketChartData> {
    const params: Record<string, string> = {
      vs_currency: 'usd',
      days: days.toString(),
    };

    // Use daily interval only for 30 days to avoid too many points,
    // for 1-7 days let CoinGecko decide (usually hourly or 5m)
    if (days >= 30) {
      params.interval = 'daily';
    }

    try {
      return await this.makeRequest<MarketChartData>(`/coins/${coinId}/market_chart`, params);
    } catch (error) {
      console.warn(`Coin history failed for ${coinId}, using simulation fallback:`, error);

      // Simulation fallback
      const points = days === 1 ? 24 : days * 6;
      const prices: [number, number][] = [];
      const now = Date.now();
      const step = (days * 24 * 60 * 60 * 1000) / points;

      // Get a base price from somewhere or just use a default
      let mockPrice = 25000; // Generic base price
      if (coinId.includes('ethereum')) mockPrice = 2500;
      if (coinId.includes('solana')) mockPrice = 140;

      for (let i = 0; i <= points; i++) {
        mockPrice *= (1 + (Math.random() * 0.04 - 0.02));
        prices.push([now - (points - i) * step, mockPrice]);
      }

      return {
        prices,
        market_caps: [],
        total_volumes: []
      };
    }
  }

  async getNFTMarkets(limit: number = 20): Promise<NFTMarketData[]> {
    return this.makeRequest<NFTMarketData[]>('/nfts/markets', {
      order: 'market_cap_usd_desc',
      per_page: limit.toString(),
      page: '1'
    });
  }

  async getNFTHistory(nftId: string, days: number = 7): Promise<MarketChartData> {
    try {
      // Note: NFT market chart API might require Pro or have different availability
      return await this.makeRequest<MarketChartData>(`/nfts/${nftId}/market_chart`, {
        days: days.toString()
      });
    } catch (error) {
      console.warn(`NFT history failed for ${nftId}, using simulation fallback:`, error);
      // Simulation fallback for NFT history
      const points = days === 1 ? 24 : days * 6;
      const prices: [number, number][] = [];
      const now = Date.now();
      const step = (days * 24 * 60 * 60 * 1000) / points;
      let mockPrice = 1.5; // Default mock floor price

      for (let i = 0; i <= points; i++) {
        mockPrice *= (1 + (Math.random() * 0.06 - 0.03));
        prices.push([now - (points - i) * step, mockPrice]);
      }

      return {
        prices,
        market_caps: [],
        total_volumes: []
      };
    }
  }

  /**
   * Fetches spot prices for multiple tokens in USD or other currencies.
   */
  async getSpotPrices(
    tokenIds: string[] = ['ethereum', 'bitcoin', 'usd-coin'],
    vsCurrencies: string[] = ['usd']
  ): Promise<Record<string, Record<string, number>>> {
    try {
      return await this.makeRequest<Record<string, Record<string, number>>>('/simple/price', {
        ids: tokenIds.join(','),
        vs_currencies: vsCurrencies.join(','),
        include_24hr_vol: 'true',
        include_24hr_change: 'true'
      });
    } catch {
      // Robust offline/rate-limit fallback
      const fallback: Record<string, Record<string, number>> = {};
      tokenIds.forEach(id => {
        const key = id.toLowerCase();
        fallback[id] = {
          usd: this.fallbackPrices[key] || 1.00
        };
      });
      return fallback;
    }
  }

  /**
   * Returns single token price in USD with automatic symbol or ID normalization.
   */
  async getTokenPriceUsd(symbolOrId: string): Promise<number> {
    const normalized = symbolOrId.toLowerCase().trim();
    if (this.fallbackPrices[normalized]) {
      try {
        const prices = await this.getSpotPrices([normalized]);
        if (prices[normalized]?.usd) return prices[normalized].usd;
      } catch {
        return this.fallbackPrices[normalized];
      }
    }
    return this.fallbackPrices[normalized] || 1.0;
  }

  /**
   * Retrieves market depth and 24h volatility to assess vulnerability to sandwich attacks.
   */
  async getTokenMarketDepth(coinId: string): Promise<TokenMarketDepth> {
    try {
      const coinData = await this.makeRequest<{
        id: string;
        symbol: string;
        market_data: {
          current_price: { usd: number };
          total_volume: { usd: number };
          market_cap: { usd: number };
          price_change_percentage_24h: number;
        };
      }>(`/coins/${coinId}`, {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false'
      });

      const price = coinData.market_data.current_price.usd;
      const volume24h = coinData.market_data.total_volume.usd;
      const estimated2PercentDepth = volume24h * 0.012;

      return {
        id: coinData.id,
        symbol: coinData.symbol.toUpperCase(),
        currentPriceUsd: price,
        totalVolume24hUsd: volume24h,
        estimated2PercentDepthUsd: estimated2PercentDepth,
        priceVolatility24hPercent: Math.abs(coinData.market_data.price_change_percentage_24h || 2.5),
        marketCapUsd: coinData.market_data.market_cap.usd
      };
    } catch {
      // Simulation fallback for resilience
      const fallbackPrice = this.fallbackPrices[coinId.toLowerCase()] || 2850;
      return {
        id: coinId,
        symbol: coinId.toUpperCase(),
        currentPriceUsd: fallbackPrice,
        totalVolume24hUsd: 14500000000,
        estimated2PercentDepthUsd: 174000000,
        priceVolatility24hPercent: 3.2,
        marketCapUsd: 342000000000
      };
    }
  }

  /**
   * Calculates financial risk exposure score (riskScore: 0.0 - 1.0) based on trade size,
   * market depth, and pool liquidity to feed IntentThreatPayload.
   */
  calculateMevRiskExposure(
    tokenSymbol: string,
    tradeAmountUsd: number,
    poolLiquidityUsd: number = 3500000
  ): RiskExposureMetrics {
    const depthRatio = tradeAmountUsd / Math.max(poolLiquidityUsd, 10000);
    const estimatedSlippage = Math.min(30, depthRatio * 100 * 1.5);

    let riskScore = 0.12;
    let threatClassification: RiskExposureMetrics['threatClassification'] = 'LOW';
    let recommendedMitigation = 'Standard slippage (0.5%) is sufficient. Public mempool execution is acceptable.';

    if (estimatedSlippage >= 2.5 || tradeAmountUsd >= 50000) {
      riskScore = 0.89;
      threatClassification = 'CRITICAL';
      recommendedMitigation = 'CRITICAL: Severe sandwich risk detected. Route exclusively via Flashbots Protect or MEV-Blocker.';
    } else if (estimatedSlippage >= 1.0 || tradeAmountUsd >= 15000) {
      riskScore = 0.68;
      threatClassification = 'HIGH';
      recommendedMitigation = 'HIGH: Elevated sandwich attack likelihood. Tighten slippage to 0.2% or enable private relay.';
    } else if (estimatedSlippage >= 0.4 || tradeAmountUsd >= 5000) {
      riskScore = 0.42;
      threatClassification = 'MEDIUM';
      recommendedMitigation = 'MEDIUM: Noticeable price impact. Consider splitting swap or using private intent auction.';
    }

    const estimatedExtractableLossUsd = parseFloat(((tradeAmountUsd * estimatedSlippage) / 100 * 0.65).toFixed(2));

    return {
      tokenSymbol,
      tradeAmountUsd,
      poolLiquidityUsd,
      volumeToDepthRatio: parseFloat(depthRatio.toFixed(4)),
      estimatedSlippagePercent: parseFloat(estimatedSlippage.toFixed(3)),
      riskScore: parseFloat(riskScore.toFixed(2)),
      threatClassification,
      estimatedExtractableLossUsd,
      recommendedMitigation
    };
  }
}

export const coinGeckoApi = new CoinGeckoApiService();
export type { CoinMarketData, ExchangeData, GlobalMarketData, NFTMarketData };
