import React from 'react';
import { Settings, X, Download, FileJson, Camera } from 'lucide-react';
import { AnimationSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval: number;
  setRefreshInterval: (value: number) => void;
  animationSettings: AnimationSettings;
  setAnimationSettings: (settings: AnimationSettings) => void;
  onResetLayout?: () => void;
  onExportJson?: () => void;
  onExportPng?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  refreshInterval,
  setRefreshInterval,
  animationSettings,
  setAnimationSettings,
  onResetLayout,
  onExportJson,
  onExportPng
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-24 right-6 w-80 bg-gray-900 bg-opacity-95 backdrop-blur-md border border-gray-700 rounded-xl p-5 shadow-2xl z-30">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Settings size={20} className="text-blue-400" />
          Dashboard Settings
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close Settings"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Refresh Interval */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 block">
            Refresh Interval: <span className="text-blue-400">{refreshInterval / 1000}s</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15000, 30000, 60000].map((interval) => (
              <button
                key={interval}
                onClick={() => setRefreshInterval(interval)}
                className={`px-2 py-1.5 text-xs rounded-md border transition-all ${
                  refreshInterval === interval
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-500'
                }`}
              >
                {interval / 1000}s
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-800 w-full" />

        {/* Animation Toggle */}
        <div className="flex items-center justify-between">
          <label id="animation-label" className="text-sm font-medium text-gray-300">Enable Animations</label>
          <button
            onClick={() => setAnimationSettings({ ...animationSettings, enabled: !animationSettings.enabled })}
            aria-labelledby="animation-label"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              animationSettings.enabled ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                animationSettings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Breathing Intensity */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label id="breathing-label" className="text-sm font-medium text-gray-300">Node Breathing</label>
            <span className="text-xs text-blue-400">{Math.round(animationSettings.breathingIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={animationSettings.breathingIntensity}
            disabled={!animationSettings.enabled}
            aria-labelledby="breathing-label"
            onChange={(e) => setAnimationSettings({ ...animationSettings, breathingIntensity: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Particle Speed */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label id="particle-label" className="text-sm font-medium text-gray-300">Particle Speed</label>
            <span className="text-xs text-blue-400">{Math.round(animationSettings.particleSpeed * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={animationSettings.particleSpeed}
            disabled={!animationSettings.enabled}
            aria-labelledby="particle-label"
            onChange={(e) => setAnimationSettings({ ...animationSettings, particleSpeed: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-800">
        <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider font-semibold">
          Performance Mode
        </p>
        <button
          onClick={() => setAnimationSettings({ enabled: false, breathingIntensity: 0, particleSpeed: 0 })}
          className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs rounded-lg border border-slate-700 transition-colors"
        >
          Disable All Animations
        </button>
      </div>

      {(onExportJson || onExportPng) && (
        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Download size={10} /> Export Data & View
          </p>
          <div className="grid grid-cols-2 gap-2">
            {onExportJson && (
              <button
                onClick={onExportJson}
                className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs rounded-lg border border-slate-700 transition-colors"
              >
                <FileJson size={14} /> JSON
              </button>
            )}
            {onExportPng && (
              <button
                onClick={onExportPng}
                className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs rounded-lg border border-slate-700 transition-colors"
              >
                <Camera size={14} /> PNG
              </button>
            )}
          </div>
        </div>
      )}

      {onResetLayout && (
        <div className="mt-4">
          <button
            onClick={onResetLayout}
            className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs rounded-lg border border-red-900/50 transition-colors font-bold uppercase tracking-widest"
          >
            Reset Custom Layout
          </button>
        </div>
      )}
    </div>
  );
};
