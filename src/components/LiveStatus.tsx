import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardMode } from '../types';

interface LiveStatusProps {
  nodeCount: number;
  connectionCount: number;
  mode: DashboardMode;
  className?: string;
  defaultCollapsed?: boolean;
}

export const LiveStatus: React.FC<LiveStatusProps> = React.memo(({
  nodeCount,
  connectionCount,
  mode,
  className,
  defaultCollapsed = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className={className ?? "absolute top-3 right-3 sm:top-4 sm:right-4 z-10 bg-gray-900/85 hover:bg-gray-800/90 backdrop-blur-md border border-gray-700/80 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-lg transition-all select-none cursor-pointer"}
        title="Show live status details"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-400 text-xs font-bold uppercase tracking-tight">Live</span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setIsCollapsed(true)}
      className={className ?? "absolute top-3 right-3 sm:top-4 sm:right-4 z-10 bg-gray-900/90 hover:bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 shadow-lg transition-all select-none cursor-pointer text-left"}
      title="Click to collapse status"
    >
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-400 text-xs font-bold uppercase tracking-tight whitespace-nowrap">Live</span>
      </div>
      <div className="w-px h-3 bg-slate-700" />
      <div className="text-gray-300 text-[10px] sm:text-xs font-mono uppercase whitespace-nowrap">
        {nodeCount} {mode === 'crypto' ? 'Assets' : 'Collections'} • {connectionCount} Links
      </div>
      <ChevronUp size={12} className="text-gray-400" />
    </button>
  );
});

LiveStatus.displayName = 'LiveStatus';
