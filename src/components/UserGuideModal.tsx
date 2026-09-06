import React, { useState } from 'react';
import { X, BookOpen, ShieldAlert, Cpu, Layers, HelpCircle, Terminal, CheckCircle2 } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mev' | 'controls' | 'architecture' | 'api'>('mev');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                BlotChain & ThreatVisualizer3D User Guide
              </h2>
              <p className="text-xs text-slate-400">
                Architectural overview, MEV security models, and spatial threat visualization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-5 pt-3 border-b border-slate-800 gap-2 bg-slate-950/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('mev')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'mev'
                ? 'border-red-500 text-red-400 bg-red-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert size={16} />
            MEV & Threat Visualization
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'controls'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={16} />
            Modes & Navigation (2D/3D/VR)
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={16} />
            Architecture & Memory (React + Three.js)
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={16} />
            Data Contract & API
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
          {activeTab === 'mev' && (
            <div className="space-y-4">
              <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl">
                <h3 className="text-base font-bold text-red-400 mb-1 flex items-center gap-2">
                  <ShieldAlert size={18} /> What is ThreatVisualizer3D?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ThreatVisualizer3D is a real-time spatial WebGL engine designed to detect, visualize, and mitigate
                  Maximal Extractable Value (MEV) attacks, toxic order flow, and user intent exploits across decentralized exchanges.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                    Sandwich Attacks
                  </div>
                  <p className="text-xs text-slate-300">
                    An MEV searcher detects a victim's pending swap, places a front-run transaction to inflate the asset price,
                    and executes a back-run transaction to extract guaranteed profit from the victim's elevated slippage.
                  </p>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                    Frontrunning & Toxic Gas Bribes
                  </div>
                  <p className="text-xs text-slate-300">
                    Priority Gas Auctions (PGA) and private validator bundles bribe block proposers to reorder transactions,
                    displacing legitimate decentralized intentions.
                  </p>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                    Just-in-Time (JIT) Liquidity
                  </div>
                  <p className="text-xs text-slate-300">
                    Searchers mint concentrated liquidity directly ahead of large Uniswap V3 swaps and burn it immediately within
                    the same block, capturing fees away from passive liquidity providers.
                  </p>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Automated Defense & Mitigation
                  </div>
                  <p className="text-xs text-slate-300">
                    Intelligent routing via private RPCs (MEV-Blocker / Flashbots Protect), dynamic slippage tightening,
                    and intent batch auctions with cryptographic commitment.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-2">
                  Risk Threshold & Threat HUD
                </h4>
                <p className="text-xs text-slate-400">
                  When <code className="text-red-400 font-mono">riskScore ≥ riskThreshold</code> (default 0.70),
                  an interactive emergency Threat HUD activates in the top-right corner of the spatial scene, detailing
                  attack vector telemetry, estimated economic impact, and recommended defense actions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 border border-slate-700 p-4 rounded-xl">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Layers size={18} className="text-indigo-400" />
                  Four Visualization Modes
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>1. 2D DASHBOARD:</strong> Interactive SVG liquidity pool graph featuring real-time particle dynamics, draggable nodes, contagion cascade waves, and live CoinGecko feeds.</p>
                  <p><strong>2. 3D SPACE:</strong> Full spherical 3D cosmos of crypto assets, pools, and cross-token liquidity channels.</p>
                  <p><strong>3. VR SPACE:</strong> WebXR virtual reality environment featuring stereoscopic binocular rendering.</p>
                  <p><strong>4. THREAT 3D:</strong> Dedicated MEV intent security engine with OrbitControls, risk pulsation shaders, and transaction payload inspectors.</p>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700 p-4 rounded-xl">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <HelpCircle size={16} className="text-blue-400" /> 3D Camera & Spatial Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">Left Mouse Button</span>
                    Orbit rotate around the center of the scene
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">Mouse Wheel / Pinch</span>
                    Smooth continuous zoom in and out
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">Click Sphere Node</span>
                    Select node and inspect full on-chain telemetry
                  </div>
                </div>
              </div>

              <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-xl text-xs text-blue-300">
                💡 <strong>Streamlined UI Architecture:</strong> To maximize the 3D viewport, ancillary panels (legend, category filters, attack simulator, and node inspector) are docked as floating badges. Expand any tool with a single click.
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu size={16} className="text-emerald-400" /> Resource & Memory Management in Three.js
                </h3>
                <p className="text-slate-300">
                  ThreatVisualizer3D prevents WebGL memory and context leaks through strict lifecycle separation:
                </p>
                <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500/50 mt-2">
                  <p><strong className="text-emerald-400">1. Mount Effect:</strong> Renderer, scene graph, lighting, and OrbitControls are instantiated once upon mounting.</p>
                  <p><strong className="text-emerald-400">2. Update Effect:</strong> On payload updates, previous geometries (<code>child.geometry.dispose()</code>) and materials (<code>child.material.dispose()</code>) are systematically destroyed before creating new meshes.</p>
                  <p><strong className="text-emerald-400">3. ResizeObserver:</strong> Dynamically adapts camera projection matrices and frame buffer resolutions without reloading the WebGL context.</p>
                  <p><strong className="text-emerald-400">4. WebGL Error Boundary:</strong> Catches WebGL unavailability and renders a non-blocking fallback interface.</p>
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="font-bold text-white text-xs mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> Scalability & Performance
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong>Up to 50 nodes:</strong> Standard Three.js Mesh instances with custom ShaderMaterials ensure a locked 60 FPS across all devices.</li>
                  <li><strong>Over 50 nodes:</strong> Ready for THREE.InstancedMesh to render thousands of transactions in a single GPU draw-call.</li>
                  <li><strong>Mobile Viewports:</strong> Adaptive capping of <code className="text-blue-400">devicePixelRatio</code> to 2 prevents GPU overheating and excessive battery consumption.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-xs mb-2">TypeScript Interfaces (src/types/mev.ts)</h4>
                <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded-lg text-slate-300 overflow-x-auto border border-slate-800">
{`interface IntentThreatPayload {
  visualization?: {
    nodes: ThreatNode[];
  };
  riskAssessment?: {
    riskScore: number;         // 0.0 - 1.0
    detectedThreats: string[];
    actionTaken?: string;
  };
  meta?: {
    blockNumber?: number;
    attackVector?: 'SANDWICH' | 'FRONTRUN' | 'JIT_LIQUIDITY' | string;
    estimatedLossUsd?: number;
  };
}

interface ThreatNode {
  id: string;
  label: string;
  type: 'WALLET' | 'DEX_POOL' | 'TRANSACTION' | 'CONTRACT' | string;
  threatColor?: string;    // HEX (#ef4444)
  isPulsing?: boolean;    // High-risk animation
}`}
                </pre>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 text-xs">
                <h4 className="font-bold text-white mb-2">Component Parameters (Props)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-blue-400">payload</span>
                    <span className="text-slate-400 block">IntentThreatPayload | null</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-blue-400">riskThreshold</span>
                    <span className="text-slate-400 block">number (def: 0.7)</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-blue-400">enableOrbitControls</span>
                    <span className="text-slate-400 block">boolean (def: true)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">BlotChain • Real-Time MEV & Intent Security Visualizer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
