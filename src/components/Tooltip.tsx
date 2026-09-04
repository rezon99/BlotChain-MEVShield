import React from 'react';
import { TooltipData } from '../types';
import { Sparkline } from './Sparkline';

interface TooltipProps {
  data: TooltipData;
}

export const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  if (!data.visible) return null;

  const node = data.node;

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 6 : 2 })}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const color = value >= 0 ? '#22c55e' : '#ef4444';
    return (
      <span style={{ color }}>{sign}{value.toFixed(2)}%</span>
    );
  };

  if (node.isHub) {
    return (
      <div
        className="fixed pointer-events-none z-50 bg-gray-900 bg-opacity-95 backdrop-blur-md border border-blue-500/30 rounded-lg p-3 shadow-2xl min-w-[150px]"
        style={{
          left: `${data.x}px`,
          top: `${data.y}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="text-blue-400 font-bold text-sm mb-1">{node.name} Network</div>
        <div className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Central Hub</div>
      </div>
    );
  }

  return (
    <div
      className="fixed pointer-events-none z-50 transform -translate-x-1/2"
      style={{
        left: data.x,
        top: data.y,
        transform: 'translateX(-50%) translateY(-100%)'
      }}
    >
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-2xl max-w-xs">
        <div className="text-white mb-2">
          <h3 className="font-semibold text-lg">{node.name}</h3>
          <p className="text-gray-400 text-sm">{node.category}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">{node.volume24h !== undefined ? 'Market Cap:' : 'Liquidity:'}</span>
            <span className="text-white font-medium">
              {formatCurrency(node.liquidity)}
            </span>
          </div>

          {node.volume24h !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-300">24h Volume:</span>
              <span className="text-white font-medium">
                {formatCurrency(node.volume24h)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-300">{node.volume24h !== undefined ? 'Floor Change:' : '24h Change:'}</span>
            <span className="font-medium">
              {formatPercentage(node.change24h)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">7d Change:</span>
            <span className="font-medium">
              {formatPercentage(node.change7d)}
            </span>
          </div>
        </div>
        
        {node.sparkline && (
          <div className="mt-3 pt-3 border-t border-gray-700 flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">7D Price Trend</span>
            <div className="bg-slate-800/30 rounded p-1 flex justify-center">
              <Sparkline
                data={node.sparkline}
                width={200}
                height={40}
                color={node.change7d >= 0 ? '#22c55e' : '#ef4444'}
              />
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: node.color }}
            />
            <span className="text-xs text-gray-400">
              {Math.abs(node.change24h) > 20 ? 'High Volatility' :
               node.change24h > 5 ? 'Growing' :
               node.change24h < -5 ? 'Declining' : 'Stable'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};