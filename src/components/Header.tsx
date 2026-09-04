import React, { useState } from 'react';
import { LayoutGrid, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardMode } from '../types';

interface HeaderProps {
  lastUpdate: Date;
  mode?: DashboardMode;
  onModeSwitch?: (mode: DashboardMode) => void;
  onOpenSettings: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  viewMode?: '2d' | '3d' | 'vr';
  onViewModeSwitch?: (viewMode: '2d' | '3d' | 'vr') => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  lastUpdate,
  onOpenSettings,
  selectedCount,
  onClearSelection,
  viewMode = '2d',
  onViewModeSwitch
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (isCollapsed) {
    return (
      <div className="relative z-20 px-2 sm:px-4 pt-2 pb-1 flex justify-between items-center select-none pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/85 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-700/70 shadow-lg pointer-events-auto">
          <LayoutGrid className="text-blue-500 shrink-0" size={16} />
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">BlotChain</span>

          {onViewModeSwitch && (
            <div className="flex bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 text-[10px] sm:text-xs font-bold gap-0.5 ml-1">
              {(['2d', '3d', 'vr'] as const).map(vm => (
                <button
                  key={vm}
                  onClick={() => onViewModeSwitch(vm)}
                  className={`px-2 py-0.5 rounded uppercase transition-all ${
                    viewMode === vm ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                  title={`Switch to ${vm.toUpperCase()} view`}
                >
                  {vm}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded hover:bg-slate-800/80 transition-colors ml-1"
            title="Expand menu"
          >
            <span>Menu</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-800/60 rounded-full text-xs font-bold shadow-md transition-all"
            >
              CLEAR ({selectedCount})
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-slate-900/85 hover:bg-slate-800 text-gray-300 hover:text-white rounded-full border border-slate-700/70 backdrop-blur-md transition-colors shadow-md"
            title="Settings"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-20 px-3 py-2 sm:px-4 sm:py-3 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 md:gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <LayoutGrid className="text-blue-500" size={22} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              BlotChain Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            Live from CoinGecko • Updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* View Mode (2D / 3D / VR) Switcher */}
          {onViewModeSwitch && (
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 backdrop-blur-md overflow-x-auto gap-1">
              <button
                onClick={() => onViewModeSwitch('2d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  viewMode === '2d' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] bg-slate-900/60 text-indigo-300 px-1 py-0.5 rounded">2D</span>
                DASHBOARD
              </button>
              <button
                onClick={() => onViewModeSwitch('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  viewMode === '3d' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] bg-slate-900/60 text-indigo-300 px-1 py-0.5 rounded">3D</span>
                SPACE
              </button>
              <button
                onClick={() => onViewModeSwitch('vr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  viewMode === 'vr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] bg-slate-900/60 text-indigo-300 px-1 py-0.5 rounded">VR</span>
                VR SPACE
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-auto">
          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 rounded-lg transition-all text-sm font-bold"
            >
              CLEAR ({selectedCount})
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg border border-slate-700 transition-colors"
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>

          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg border border-slate-700 text-xs font-semibold transition-colors"
            title="Collapse menu"
          >
            <span>Collapse</span>
            <ChevronUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

Header.displayName = 'Header';
