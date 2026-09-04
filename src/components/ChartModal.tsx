import React, { useState, useEffect } from 'react';
import { Node } from '../types';
import { X, TrendingUp, TrendingDown, DollarSign, Plus, BarChart3 } from 'lucide-react';
import { DetailedChart } from './DetailedChart';
import { coinGeckoApi } from '../services/coinGeckoApi';
import { LoadingSpinner } from './LoadingSpinner';

interface ChartModalProps {
  node: Node | null;
  onClose: () => void;
  onAddToComparison: (nodeId: string) => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({ node, onClose, onAddToComparison }) => {
  const [timeframe, setTimeframe] = useState<number>(7);
  const [historyData, setHistoryData] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!node) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = node.volume24h !== undefined
          ? await coinGeckoApi.getNFTHistory(node.id, timeframe)
          : await coinGeckoApi.getCoinHistory(node.id, timeframe);

        setHistoryData(data.prices);
      } catch (err) {
        setError('Failed to load historical data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [node, timeframe]);

  if (!node) return null;

  const isPositive = node.change24h >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-start p-6 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-4">
            {node.image ? (
              <img src={node.image} className="w-12 h-12 rounded-full border-2 border-slate-700" alt={node.name} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold">
                {node.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{node.name}</h2>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded uppercase tracking-wider font-bold">
                  {node.category}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-white font-semibold">
                  <DollarSign size={16} className="text-gray-500" />
                  {node.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: node.price < 1 ? 6 : 2 })}
                </div>
                <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(node.change24h).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Price History</h3>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              {[
                { label: '24H', value: 1 },
                { label: '7D', value: 7 },
                { label: '30D', value: 30 }
              ].map(tf => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    timeframe === tf.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 h-[350px]">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <LoadingSpinner />
                <span className="text-slate-500 text-sm animate-pulse">Fetching market data...</span>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-red-400 gap-2">
                <X size={40} className="opacity-20" />
                <span>{error}</span>
                <button
                  onClick={() => setTimeframe(timeframe)}
                  className="mt-2 text-sm text-blue-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <DetailedChart data={historyData} width={820} height={310} color={isPositive ? '#22c55e' : '#ef4444'} />
            )}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Liquidity</div>
                <div className="text-white font-bold">${(node.liquidity / 1e9).toFixed(2)}B</div>
              </div>
              {node.volume24h !== undefined && (
                <div>
                  <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">24h Volume</div>
                  <div className="text-white font-bold">${(node.volume24h / 1e6).toFixed(2)}M</div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onAddToComparison(node.id);
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={18} />
              Add to Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
