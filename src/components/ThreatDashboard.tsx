import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThreatVisualizer3D } from './ThreatVisualizer3D';
import { Header } from './Header';
import { IntentThreatPayload, ThreatNode, ThreatAttackType } from '../types/mev';
import { DashboardMode } from '../types';
import {
  Sliders,
  Radio,
  ChevronUp,
  ChevronDown,
  X,
  Zap,
  Info
} from 'lucide-react';

interface ThreatDashboardProps {
  mode: DashboardMode;
  onModeSwitch: (mode: DashboardMode) => void;
  viewMode?: '2d' | '3d' | 'vr' | 'threat3d';
  onViewModeSwitch?: (viewMode: '2d' | '3d' | 'vr' | 'threat3d') => void;
  onOpenGuide?: () => void;
  onStartTour?: () => void;
}

// Preset Attack Scenarios for live demonstration and testing
const ATTACK_SCENARIOS: Record<ThreatAttackType, IntentThreatPayload> = {
  SANDWICH: {
    visualization: {
      nodes: [
        {
          id: 'victim_wallet',
          label: 'Victim Wallet (0x7a...49f)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f',
            role: 'victim',
            valueEth: 18.5,
            gasPriceGwei: 28,
            slippageTolerance: 2.0,
            intentType: 'SWAP_ETH_FOR_USDC',
            status: 'Pending in Public Mempool'
          }
        },
        {
          id: 'frontrun_tx',
          label: 'Frontrun Bot (0x92...3a1)',
          type: 'TRANSACTION',
          threatColor: '#ef4444',
          isPulsing: true,
          details: {
            address: '0x92a4E1Bcb38627bCd15eD500473a254D16a13a1',
            role: 'attacker',
            gasPriceGwei: 95,
            minerBribeEth: 0.14,
            intentType: 'PRE_SWAP_PUMP',
            status: 'Bundled via Flashbots'
          }
        },
        {
          id: 'dex_pool',
          label: 'Uniswap V3 ETH/USDC 0.05%',
          type: 'DEX_POOL',
          threatColor: '#f97316',
          isPulsing: true,
          details: {
            address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
            role: 'pool',
            valueEth: 4820,
            status: 'Price Displaced (+1.84%)'
          }
        },
        {
          id: 'backrun_tx',
          label: 'Backrun Bot (0x92...3a1)',
          type: 'TRANSACTION',
          threatColor: '#ef4444',
          isPulsing: true,
          details: {
            address: '0x92a4E1Bcb38627bCd15eD500473a254D16a13a1',
            role: 'attacker',
            gasPriceGwei: 28,
            intentType: 'POST_SWAP_DUMP',
            status: 'Harvesting Extracted MEV'
          }
        },
        {
          id: 'block_builder',
          label: 'Titan Builder #41',
          type: 'CONTRACT',
          threatColor: '#3b82f6',
          isPulsing: false,
          details: {
            address: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
            role: 'searcher',
            minerBribeEth: 0.14,
            status: 'Block Proposal #20689401'
          }
        }
      ]
    },
    riskAssessment: {
      riskScore: 0.94,
      detectedThreats: [
        'Deterministic Sandwich Bundle Detected (ID: 0x8df1)',
        'Excessive Slippage Exploitation (>1.5%)',
        'Direct Miner Bribe via coinbase.transfer (0.14 ETH)'
      ],
      actionTaken: 'Rerouted to Flashbots Protect + Slippage Capped at 0.3%'
    },
    meta: {
      blockNumber: 20689401,
      timestamp: new Date().toISOString(),
      attackVector: 'SANDWICH',
      estimatedLossUsd: 1420.50,
      targetPair: 'ETH/USDC 0.05%'
    }
  },

  FRONTRUN: {
    visualization: {
      nodes: [
        {
          id: 'target_intent',
          label: 'User Intent (0x33...c91)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x33b8aD360e229fA265E98B4B8B67D3a10F4Ac91',
            role: 'victim',
            valueEth: 45.0,
            gasPriceGwei: 32,
            intentType: 'NFT_MINT_OR_SWAP',
            status: 'Detected in P2P gossip'
          }
        },
        {
          id: 'priority_gas_bid',
          label: 'Searcher PGA Bot (0x1f...520)',
          type: 'TRANSACTION',
          threatColor: '#ef4444',
          isPulsing: true,
          details: {
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            role: 'attacker',
            gasPriceGwei: 180,
            minerBribeEth: 0.35,
            intentType: 'PRIORITY_GAS_AUCTION',
            status: 'Gas Replacement Attack'
          }
        },
        {
          id: 'mempool_node',
          label: 'Global Mempool Node',
          type: 'CONTRACT',
          threatColor: '#eab308',
          isPulsing: false,
          details: {
            role: 'mempool',
            status: 'High Congestion State'
          }
        },
        {
          id: 'mev_shield',
          label: 'BlotChain Shield RPC',
          type: 'CONTRACT',
          threatColor: '#38bdf8',
          isPulsing: false,
          details: {
            role: 'searcher',
            status: 'Encrypted Mempool Activated'
          }
        }
      ]
    },
    riskAssessment: {
      riskScore: 0.86,
      detectedThreats: [
        'Priority Gas Auction (PGA) Displacement',
        'Gas Price Escalation (+462% over median)'
      ],
      actionTaken: 'Transaction Encrypted via Private Relay'
    },
    meta: {
      blockNumber: 20689402,
      timestamp: new Date().toISOString(),
      attackVector: 'FRONTRUN',
      estimatedLossUsd: 890.00,
      targetPair: 'P2P Gossip'
    }
  },

  JIT_LIQUIDITY: {
    visualization: {
      nodes: [
        {
          id: 'large_trader',
          label: 'Whale Trader (0x55...81b)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x55d398326f99059fF775485246999027B3197955',
            role: 'victim',
            valueEth: 120.0,
            intentType: 'LARGE_AMM_SWAP',
            status: 'Pending'
          }
        },
        {
          id: 'jit_mint',
          label: 'JIT LP Mint (0x81...cc0)',
          type: 'TRANSACTION',
          threatColor: '#f97316',
          isPulsing: true,
          details: {
            address: '0x8180A045C86b3BFE17F8D409Db957c5E1b83cc0',
            role: 'attacker',
            intentType: 'MINT_CONCENTRATED_TICKS',
            status: 'Atomic Flash Loan Mint'
          }
        },
        {
          id: 'target_dex',
          label: 'Curve 3pool / Uni V3',
          type: 'DEX_POOL',
          threatColor: '#eab308',
          isPulsing: true,
          details: {
            role: 'pool',
            status: 'Fee Sniping in Progress'
          }
        },
        {
          id: 'jit_burn',
          label: 'JIT LP Burn & Repay',
          type: 'TRANSACTION',
          threatColor: '#ef4444',
          isPulsing: true,
          details: {
            role: 'attacker',
            intentType: 'BURN_CONCENTRATED_TICKS',
            status: 'Atomic Repay Flash Loan'
          }
        }
      ]
    },
    riskAssessment: {
      riskScore: 0.78,
      detectedThreats: [
        'Just-in-Time (JIT) Liquidity Injection',
        'Atomic LP Fee Cannibalization ($2,140 diverted)'
      ],
      actionTaken: 'Split Swap Across 3 Isolated Liquidity Sources'
    },
    meta: {
      blockNumber: 20689403,
      timestamp: new Date().toISOString(),
      attackVector: 'JIT_LIQUIDITY',
      estimatedLossUsd: 2140.00,
      targetPair: 'Curve / Uniswap'
    }
  },

  SLIPPAGE: {
    visualization: {
      nodes: [
        {
          id: 'retail_user',
          label: 'Retail Swapper (0x12...98c)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x12c8b09320857E4e9b8B6a78fbc383610998c',
            role: 'victim',
            valueEth: 3.2,
            slippageTolerance: 5.0,
            intentType: 'LOW_LIQUIDITY_PAIR',
            status: 'High Default Slippage'
          }
        },
        {
          id: 'toxic_drain',
          label: 'Arbitrage Bot #704',
          type: 'TRANSACTION',
          threatColor: '#ef4444',
          isPulsing: true,
          details: {
            role: 'attacker',
            intentType: 'MAX_SLIPPAGE_EXTRACTION',
            status: 'Artificially Depressed Output'
          }
        },
        {
          id: 'illiquid_pool',
          label: 'Thin AMM Pool (DEGEN/WETH)',
          type: 'DEX_POOL',
          threatColor: '#f97316',
          isPulsing: true,
          details: {
            role: 'pool',
            status: 'Low Depth ($18k TVL)'
          }
        }
      ]
    },
    riskAssessment: {
      riskScore: 0.82,
      detectedThreats: [
        'High Slippage Tolerance Vulnerability (5.0%)',
        'Low TVL Reserve Imbalance Exploitation'
      ],
      actionTaken: 'Enforced Max 0.5% Slippage Guard'
    },
    meta: {
      blockNumber: 20689404,
      timestamp: new Date().toISOString(),
      attackVector: 'SLIPPAGE_EXPLOIT',
      estimatedLossUsd: 490.00,
      targetPair: 'DEGEN/WETH'
    }
  },

  NORMAL: {
    visualization: {
      nodes: [
        {
          id: 'safe_wallet',
          label: 'Protected Wallet (0x44...9a2)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x4408b09320857E4e9b8B6a78fbc38361099a2',
            role: 'victim',
            valueEth: 5.0,
            gasPriceGwei: 22,
            intentType: 'LIMIT_INTENT_COW',
            status: 'Batch Auction / Off-chain Intent'
          }
        },
        {
          id: 'safe_solver',
          label: 'CoW Protocol Solver #12',
          type: 'CONTRACT',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            role: 'searcher',
            status: 'Uniform Clearing Price'
          }
        },
        {
          id: 'safe_pool',
          label: 'Uniswap V3 USDC/USDT',
          type: 'DEX_POOL',
          threatColor: '#3b82f6',
          isPulsing: false,
          details: {
            role: 'pool',
            status: 'Zero Toxic Flow'
          }
        }
      ]
    },
    riskAssessment: {
      riskScore: 0.12,
      detectedThreats: [],
      actionTaken: 'Optimal Private Execution'
    },
    meta: {
      blockNumber: 20689405,
      timestamp: new Date().toISOString(),
      attackVector: 'SAFE_FLOW',
      estimatedLossUsd: 0.00,
      targetPair: 'USDC/USDT 0.01%'
    }
  }
};

export const ThreatDashboard: React.FC<ThreatDashboardProps> = ({
  mode,
  onModeSwitch,
  viewMode = 'threat3d',
  onViewModeSwitch,
  onOpenGuide,
  onStartTour
}) => {
  const [currentScenario, setCurrentScenario] = useState<ThreatAttackType>('SANDWICH');
  const [customThreshold, setCustomThreshold] = useState<number>(0.7);
  const [selectedNode, setSelectedNode] = useState<ThreatNode | null>(null);
  const [isSimulatorCollapsed, setIsSimulatorCollapsed] = useState<boolean>(true);
  const [isAutoStreamActive, setIsAutoStreamActive] = useState<boolean>(false);
  const [simulatedBlock, setSimulatedBlock] = useState<number>(20689401);

  // Active payload based on scenario and block
  const activePayload = useMemo(() => {
    const base = ATTACK_SCENARIOS[currentScenario];
    return {
      ...base,
      meta: {
        ...base.meta,
        blockNumber: simulatedBlock,
        timestamp: new Date().toLocaleTimeString()
      }
    };
  }, [currentScenario, simulatedBlock]);

  // Auto-stream random threat updates every 6 seconds when active
  useEffect(() => {
    if (!isAutoStreamActive) return;

    const interval = setInterval(() => {
      const types: ThreatAttackType[] = ['SANDWICH', 'FRONTRUN', 'JIT_LIQUIDITY', 'SLIPPAGE', 'NORMAL'];
      const nextType = types[Math.floor(Math.random() * types.length)];
      setCurrentScenario(nextType);
      setSimulatedBlock(prev => prev + 1);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoStreamActive]);

  const handleSelectScenario = useCallback((scenarioKey: ThreatAttackType) => {
    setCurrentScenario(scenarioKey);
    setSelectedNode(null);
    setSimulatedBlock(prev => prev + 1);
  }, []);

  return (
    <div className="h-screen h-[100dvh] bg-[#090d16] overflow-hidden flex flex-col relative text-slate-100 select-none">
      {/* Background spatial grid decoration */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="threat-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#threat-grid)" />
        </svg>
      </div>

      {/* Main Header (compact in Threat 3D for maximized spatial viewport) */}
      <Header
        lastUpdate={new Date()}
        mode={mode}
        onModeSwitch={onModeSwitch}
        onOpenSettings={() => {}}
        selectedCount={0}
        onClearSelection={() => {}}
        viewMode={viewMode}
        onViewModeSwitch={onViewModeSwitch}
        onOpenGuide={onOpenGuide}
        onStartTour={onStartTour}
        defaultCollapsed={true}
      />

      {/* Viewport Area */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* 3D Visualizer Canvas Container */}
        <div className="w-full h-full relative">
          <ThreatVisualizer3D
            payload={activePayload}
            riskThreshold={customThreshold}
            enableOrbitControls={true}
            onNodeSelect={setSelectedNode}
            selectedNodeId={selectedNode?.id}
          />

          {/* Floating Top Controls (Guide & Tour quick access) */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2">
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800/90 text-blue-400 hover:text-blue-300 border border-blue-500/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-all"
                title="Open MEV Integration Guide"
              >
                <Info size={13} />
                <span>Guide</span>
              </button>
            )}

            {onStartTour && (
              <button
                onClick={onStartTour}
                className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800/90 text-indigo-300 hover:text-white border border-indigo-500/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-all"
                title="Start Onboarding Tour"
              >
                <Zap size={13} />
                <span>Tour</span>
              </button>
            )}
          </div>

          {/* Collapsed by default: Threat Simulator & Scenario Selector (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-20">
            {isSimulatorCollapsed ? (
              <button
                onClick={() => setIsSimulatorCollapsed(false)}
                className="flex items-center gap-2 bg-slate-950/85 hover:bg-slate-900/95 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xl transition-all cursor-pointer"
                title="Open MEV Attack Simulator"
              >
                <Sliders size={14} className="text-red-400" />
                <span>Threat Simulator: <strong className="text-red-400">{currentScenario}</strong></span>
                <ChevronUp size={14} className="text-slate-400 ml-1" />
              </button>
            ) : (
              <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 p-4 rounded-2xl shadow-2xl max-w-sm w-80 space-y-3.5 text-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Sliders size={15} className="text-red-400" />
                    <span>MEV Attack Simulator</span>
                  </div>
                  <button
                    onClick={() => setIsSimulatorCollapsed(true)}
                    className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 transition-colors"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>

                {/* Scenario buttons */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Attack Scenarios (Intent Payloads):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleSelectScenario('SANDWICH')}
                      className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                        currentScenario === 'SANDWICH'
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      🍔 Sandwich
                    </button>
                    <button
                      onClick={() => handleSelectScenario('FRONTRUN')}
                      className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                        currentScenario === 'FRONTRUN'
                          ? 'bg-yellow-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      ⚡ Frontrun (PGA)
                    </button>
                    <button
                      onClick={() => handleSelectScenario('JIT_LIQUIDITY')}
                      className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                        currentScenario === 'JIT_LIQUIDITY'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      🌊 JIT Liquidity
                    </button>
                    <button
                      onClick={() => handleSelectScenario('SLIPPAGE')}
                      className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                        currentScenario === 'SLIPPAGE'
                          ? 'bg-rose-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      🎯 Slippage Drain
                    </button>
                  </div>
                  <button
                    onClick={() => handleSelectScenario('NORMAL')}
                    className={`mt-1.5 w-full px-2.5 py-1.5 rounded-lg text-center font-medium transition-all ${
                      currentScenario === 'NORMAL'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    🛡️ Safe Flow (CoW Intent)
                  </button>
                </div>

                {/* Risk Threshold Slider */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Risk Threshold (HUD Trigger):</span>
                    <span className="font-mono font-bold text-red-400">
                      {(customThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={customThreshold}
                    onChange={(e) => setCustomThreshold(parseFloat(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Sensitive (0.1)</span>
                    <span>Strict (0.95)</span>
                  </div>
                </div>

                {/* Auto Stream Toggle */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio size={13} className={isAutoStreamActive ? 'text-red-500 animate-pulse' : 'text-slate-500'} />
                    <span className="text-[11px] text-slate-300">Live Mempool Feed:</span>
                  </div>
                  <button
                    onClick={() => setIsAutoStreamActive(!isAutoStreamActive)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      isAutoStreamActive
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAutoStreamActive ? 'ACTIVE (6s)' : 'PAUSED'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Node Inspector Drawer (shown when a node is clicked in 3D, can be closed) */}
          {selectedNode && (
            <div className="absolute top-16 left-4 z-20 max-w-sm w-80 bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2 font-bold text-white truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: selectedNode.threatColor || '#22c55e' }}
                  />
                  <span className="truncate">{selectedNode.label}</span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Node Type:</span>
                  <span className="font-mono text-white uppercase">{selectedNode.type}</span>
                </div>

                {selectedNode.details?.role && (
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Attack Role:</span>
                    <span className={`font-semibold capitalize ${
                      selectedNode.details.role === 'attacker' ? 'text-red-400 font-bold' :
                      selectedNode.details.role === 'victim' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>
                      {selectedNode.details.role}
                    </span>
                  </div>
                )}

                {selectedNode.details?.address && (
                  <div className="py-1 border-b border-slate-900">
                    <span className="text-slate-400 block mb-0.5">Address / Contract:</span>
                    <span className="font-mono text-[10px] text-blue-300 break-all bg-slate-900 p-1 rounded block">
                      {selectedNode.details.address}
                    </span>
                  </div>
                )}

                {selectedNode.details?.valueEth !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Transaction Value:</span>
                    <span className="font-mono font-bold text-white">{selectedNode.details.valueEth} ETH</span>
                  </div>
                )}

                {selectedNode.details?.gasPriceGwei !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Gas Price:</span>
                    <span className="font-mono text-yellow-400">{selectedNode.details.gasPriceGwei} Gwei</span>
                  </div>
                )}

                {selectedNode.details?.minerBribeEth !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Miner Bribe:</span>
                    <span className="font-mono text-red-400 font-bold">{selectedNode.details.minerBribeEth} ETH</span>
                  </div>
                )}

                {selectedNode.details?.status && (
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-0.5">Current Status:</span>
                    <div className="bg-slate-900/90 p-2 rounded text-[11px] text-slate-300 border border-slate-800">
                      {selectedNode.details.status}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Block & Live Metrics Badge (Top Center) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full text-[11px] font-mono text-slate-300 shadow-xl">
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              MEV Shield Active
            </span>
            <span className="text-slate-600">•</span>
            <span>Block #{activePayload.meta?.blockNumber}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{activePayload.meta?.attackVector}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
