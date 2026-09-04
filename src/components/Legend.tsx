import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { DashboardMode } from '../types';

interface LegendProps {
  mode: DashboardMode;
  className?: string;
  isCollapsible?: boolean;
}

export const Legend: React.FC<LegendProps> = React.memo(({ mode, className, isCollapsible = true }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className={className ?? "bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 transition-all"}>
      <div
        className="flex items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5">
          <HelpCircle size={14} className="text-blue-400" />
          Legend
        </h3>
        {isCollapsible && (
          <span className="text-gray-400 hover:text-white transition-colors">
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-2 pt-2 border-t border-gray-800 space-y-1.5 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-gray-300 font-medium">Growing ({mode === 'crypto' ? '+5%' : 'Bullish'})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-gray-300 font-medium">Declining ({mode === 'crypto' ? '-5%' : 'Bearish'})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-gray-300 font-medium">High Volatility (±20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-gray-300 font-medium">{mode === 'crypto' ? 'Stable' : 'Hub / Chain'}</span>
          </div>
          <div className="pt-1.5 border-t border-gray-800">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span className="text-gray-300">{mode === 'crypto' ? 'Liquidity Inflow' : 'Collection Flow'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Legend.displayName = 'Legend';
