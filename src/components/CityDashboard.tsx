import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Compass, Eye, Building2, TrendingUp, TrendingDown, X, Sparkles, Filter, Navigation } from 'lucide-react';
import { Header } from './Header';
import { CityVisualizer3D, CameraMode } from './CityVisualizer3D';
import { cityGeckoService, CityCoinData } from '../services/cityGeckoService';
import { DashboardMode } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

interface CityDashboardProps {
  mode: DashboardMode;
  onModeSwitch: (mode: DashboardMode) => void;
  viewMode?: '2d' | '3d' | 'vr' | 'threat3d' | 'city';
  onViewModeSwitch?: (viewMode: '2d' | '3d' | 'vr' | 'threat3d' | 'city') => void;
  onOpenGuide?: () => void;
  onStartTour?: () => void;
}

export const CityDashboard: React.FC<CityDashboardProps> = ({
  mode,
  onModeSwitch,
  viewMode = 'city',
  onViewModeSwitch,
  onOpenGuide,
  onStartTour
}) => {
  const [coins, setCoins] = useState<CityCoinData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [cameraMode, setCameraMode] = useState<CameraMode>('flyover');
  const [selectedCoin, setSelectedCoin] = useState<CityCoinData | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedCoinId, setFocusedCoinId] = useState<string | null>(null);

  // Fetch top list of coins for the city
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cityGeckoService.getCityTopCoins(300); // Top 300 coins
      setCoins(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load city coin data:', err);
      setError('Unable to load CoinGecko top market list for City view.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // 1 minute auto-refresh
    return () => clearInterval(interval);
  }, [loadData]);

  // Market stats calculations
  const stats = useMemo(() => {
    if (coins.length === 0) return { totalCap: 0, gainers: 0, losers: 0, avgChange: 0 };
    const totalCap = coins.reduce((acc, c) => acc + c.market_cap, 0);
    const gainers = coins.filter(c => c.price_change_percentage_24h >= 0).length;
    const losers = coins.length - gainers;
    const avgChange = coins.reduce((acc, c) => acc + c.price_change_percentage_24h, 0) / coins.length;

    return { totalCap, gainers, losers, avgChange };
  }, [coins]);

  // Search filtered coin suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return coins.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [coins, searchQuery]);

  const districts = ['All', 'Mega-Cap', 'Top 50', 'Top 100', 'Top 250', 'Top 500'];

  const handleSelectCoin = useCallback((coin: CityCoinData) => {
    setSelectedCoin(coin);
  }, []);

  const handleSearchSelect = (coin: CityCoinData) => {
    setFocusedCoinId(coin.id);
    setSelectedCoin(coin);
    setSearchQuery('');
  };

  if (loading && coins.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && coins.length === 0) {
    return <ErrorDisplay error={error} onRetry={loadData} />;
  }

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 overflow-hidden flex flex-col relative font-sans select-none">
      <Header
        lastUpdate={lastUpdate}
        mode={mode}
        onModeSwitch={onModeSwitch}
        onOpenSettings={() => {}}
        selectedCount={selectedCoin ? 1 : 0}
        onClearSelection={() => setSelectedCoin(null)}
        viewMode={viewMode}
        onViewModeSwitch={onViewModeSwitch}
        onOpenGuide={onOpenGuide}
        onStartTour={onStartTour}
      />

      {/* Main 3D Canvas Area */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <CityVisualizer3D
          coins={coins}
          selectedCoin={selectedCoin}
          onSelectCoin={handleSelectCoin}
          cameraMode={cameraMode}
          districtFilter={districtFilter}
          focusedCoinId={focusedCoinId}
        />

        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Camera Mode Toggle (Street Walk vs Flyover) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-2xl backdrop-blur-md pointer-events-auto">
            <button
              onClick={() => setCameraMode('street')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cameraMode === 'street'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation size={15} />
              <span>STREET WALK</span>
            </button>

            <button
              onClick={() => setCameraMode('flyover')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cameraMode === 'flyover'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye size={15} />
              <span>FLYOVER CITY</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative pointer-events-auto min-w-[240px] max-w-sm">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-slate-400 pointer-events-none" size={15} />
              <input
                type="text"
                placeholder="Search skyscraper coin..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900/95 border border-slate-700 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md z-30">
                {searchResults.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSearchSelect(c)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{c.symbol}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-300 font-mono">${c.current_price.toLocaleString()}</span>
                      <span className={c.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {c.price_change_percentage_24h >= 0 ? '+' : ''}{c.price_change_percentage_24h.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Left Control Tooltip & District Selector */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto max-w-xs">
          {/* Controls Instruction Overlay */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1.5 border-b border-slate-800 pb-1">
              <Compass size={14} className="text-emerald-400" />
              <span>{cameraMode === 'street' ? 'STREET WALK CONTROLS' : 'FLYOVER ORBIT CONTROLS'}</span>
            </div>
            {cameraMode === 'street' ? (
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <p>• <span className="text-emerald-400 font-bold">W A S D</span> / <span className="text-emerald-400 font-bold">Arrows</span>: Walk through streets</p>
                <p>• <span className="text-emerald-400 font-bold">Mouse Drag</span>: Look around skyscrapers</p>
                <p>• <span className="text-emerald-400 font-bold">Shift</span>: Sprint through quarters</p>
                <p>• <span className="text-emerald-400 font-bold">Click Skyscraper</span>: Inspect market metrics</p>
              </div>
            ) : (
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <p>• <span className="text-blue-400 font-bold">Left Drag</span>: Rotate city orbit view</p>
                <p>• <span className="text-blue-400 font-bold">Scroll Wheel</span>: Altitude zoom</p>
                <p>• <span className="text-blue-400 font-bold">Right Drag</span>: Pan city center</p>
                <p>• <span className="text-blue-400 font-bold">Click Skyscraper</span>: Inspect market metrics</p>
              </div>
            )}
          </div>

          {/* District Filter Pills */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-2xl backdrop-blur-md flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold px-1">
              <Filter size={12} className="text-purple-400" />
              <span>CITY DISTRICT FILTER</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {districts.map(d => (
                <button
                  key={d}
                  onClick={() => setDistrictFilter(d)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    districtFilter === d
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right City Market Summary Bar */}
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
              <Building2 className="text-blue-400" size={18} />
              <div>
                <div className="text-[10px] text-slate-400">CITY BUILDINGS</div>
                <div className="font-bold text-white font-mono">{coins.length} Skyscraper Top List</div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
              <Sparkles className="text-purple-400" size={18} />
              <div>
                <div className="text-[10px] text-slate-400">TOTAL CITY CAP</div>
                <div className="font-bold text-white font-mono">${(stats.totalCap / 1e9).toFixed(1)}B</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp size={14} />
                <span className="font-bold">{stats.gainers}</span>
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <TrendingDown size={14} />
                <span className="font-bold">{stats.losers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Coin Skyscraper Detail Modal */}
        {selectedCoin && (
          <div className="absolute top-16 right-4 z-30 w-80 bg-slate-900/95 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-right-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-lg text-white border border-slate-700">
                  #{selectedCoin.market_cap_rank}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedCoin.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedCoin.symbol} • {selectedCoin.district}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCoin(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Price</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">
                  ${selectedCoin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">24h Price Change</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedCoin.price_change_percentage_24h >= 0 ? '+' : ''}{selectedCoin.price_change_percentage_24h.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Skyscraper Height</div>
                  <div className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                    {Math.round(selectedCoin.height)}m Tall
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Market Cap:</span>
                  <span className="font-mono font-bold text-white">${selectedCoin.market_cap.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">24h Volume:</span>
                  <span className="font-mono text-slate-300">${selectedCoin.total_volume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Circulating Supply:</span>
                  <span className="font-mono text-slate-300">{Math.round(selectedCoin.circulating_supply).toLocaleString()} {selectedCoin.symbol}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
