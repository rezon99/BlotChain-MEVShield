import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThreatVisualizer3D } from './ThreatVisualizer3D';
import { Header } from './Header';
import { IntentThreatPayload, ThreatNode, ThreatAttackType } from '../types/mev';
import {
  fetchLiveThreatPayloads,
  getMevRiskData,
  mapAnalyzeResponseToIntentThreatPayload,
  getLocalSimulatedPayload,
  SwapAnalyzeResponse
} from '../services/partnerBackend';
import {
  ensService,
  arcUsdcService,
  uniswapService,
  flashbotsService,
  CANONICAL_POOLS,
  UniswapV3Pool,
  RelayHealthStatus
} from '../services';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { Web3WalletConnect } from './Web3WalletConnect';
import { DashboardMode } from '../types';
import {
  Sliders,
  Radio,
  ChevronUp,
  ChevronDown,
  X,
  Zap,
  Info,
  Tag,
  DollarSign,
  ArrowRightLeft,
  Layers
} from 'lucide-react';

interface SwapDirectionOption {
  id: string;
  label: string;
  tokenIn: string;
  tokenOut: string;
  poolLabel: string;
  feeTier: string;
}

const SWAP_DIRECTIONS: SwapDirectionOption[] = [
  { id: 'ETH_USDC', label: 'ETH ➔ USDC', tokenIn: 'ETH', tokenOut: 'USDC', poolLabel: 'Uniswap V3 ETH/USDC', feeTier: '0.05%' },
  { id: 'USDC_ETH', label: 'USDC ➔ ETH', tokenIn: 'USDC', tokenOut: 'ETH', poolLabel: 'Uniswap V3 USDC/ETH', feeTier: '0.05%' },
  { id: 'WETH_USDT', label: 'WETH ➔ USDT', tokenIn: 'WETH', tokenOut: 'USDT', poolLabel: 'Uniswap V3 WETH/USDT', feeTier: '0.30%' },
  { id: 'WBTC_WETH', label: 'WBTC ➔ WETH', tokenIn: 'WBTC', tokenOut: 'WETH', poolLabel: 'Uniswap V3 WBTC/WETH', feeTier: '0.30%' },
  { id: 'UNI_USDC', label: 'UNI ➔ USDC', tokenIn: 'UNI', tokenOut: 'USDC', poolLabel: 'Uniswap V3 UNI/USDC', feeTier: '0.30%' }
];

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
    timestamp: Date.now(),
    userAddress: '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f',
    ensName: 'trader.eth',
    visualization: {
      nodes: [
        {
          id: 'victim_wallet',
          label: 'Victim Wallet (trader.eth)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f',
            ensName: 'trader.eth',
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
          threatColor: '#FF0055',
          isPulsing: true,
          details: {
            address: '0x92a4E1Bcb38627bCd15eD500473a254D16a13a1',
            ensName: 'mev-searcher.eth',
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
            ensName: 'uniswap-v3-pool.eth',
            role: 'pool',
            valueEth: 4820,
            status: 'Price Displaced (+1.84%)'
          }
        },
        {
          id: 'backrun_tx',
          label: 'Backrun Bot (0x92...3a1)',
          type: 'TRANSACTION',
          threatColor: '#FF0055',
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
            ensName: 'titan-builder.eth',
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
      actionTaken: 'Rerouted via Private RPC + Slippage Capped at 0.3%'
    },
    meta: {
      blockNumber: 20689401,
      timestamp: new Date().toISOString(),
      attackVector: 'SANDWICH',
      estimatedLossUsd: 1420.50,
      targetPair: 'ETH/USDC 0.05%',
      protectionFeeUsdc: 0.15
    }
  },

  FRONTRUN: {
    timestamp: Date.now(),
    userAddress: '0x33b8aD360e229fA265E98B4B8B67D3a10F4Ac91',
    ensName: 'swapper.eth',
    visualization: {
      nodes: [
        {
          id: 'target_intent',
          label: 'User Intent (swapper.eth)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x33b8aD360e229fA265E98B4B8B67D3a10F4Ac91',
            ensName: 'swapper.eth',
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
          threatColor: '#FF0055',
          isPulsing: true,
          details: {
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            ensName: 'pga-bot.eth',
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
            ensName: 'blotchain-shield.eth',
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
      targetPair: 'P2P Gossip',
      protectionFeeUsdc: 0.20
    }
  },

  JIT_LIQUIDITY: {
    timestamp: Date.now(),
    userAddress: '0x55d398326f99059fF775485246999027B3197955',
    ensName: 'whale-trader.eth',
    visualization: {
      nodes: [
        {
          id: 'large_trader',
          label: 'Whale Trader (whale-trader.eth)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x55d398326f99059fF775485246999027B3197955',
            ensName: 'whale-trader.eth',
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
          threatColor: '#FF0055',
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
      targetPair: 'Curve / Uniswap',
      protectionFeeUsdc: 0.25
    }
  },

  SLIPPAGE: {
    timestamp: Date.now(),
    userAddress: '0x12c8b09320857E4e9b8B6a78fbc383610998c',
    ensName: 'retail-user.eth',
    visualization: {
      nodes: [
        {
          id: 'retail_user',
          label: 'Retail Swapper (retail-user.eth)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x12c8b09320857E4e9b8B6a78fbc383610998c',
            ensName: 'retail-user.eth',
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
          threatColor: '#FF0055',
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
      targetPair: 'DEGEN/WETH',
      protectionFeeUsdc: 0.10
    }
  },

  NORMAL: {
    timestamp: Date.now(),
    userAddress: '0x4408b09320857E4e9b8B6a78fbc38361099a2',
    ensName: 'safe-user.eth',
    visualization: {
      nodes: [
        {
          id: 'safe_wallet',
          label: 'Protected Wallet (safe-user.eth)',
          type: 'WALLET',
          threatColor: '#22c55e',
          isPulsing: false,
          details: {
            address: '0x4408b09320857E4e9b8B6a78fbc38361099a2',
            ensName: 'safe-user.eth',
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
      targetPair: 'USDC/USDT 0.01%',
      protectionFeeUsdc: 0.00
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
  const [liveBackendPayloads, setLiveBackendPayloads] = useState<IntentThreatPayload[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [activeBackendSource, setActiveBackendSource] = useState<'partner' | 'cloud' | 'local'>('local');
  const [analyzedPayload, setAnalyzedPayload] = useState<IntentThreatPayload | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Web3 Services State (ENS, Uniswap Telemetry, Flashbots Relay Health)
  const [resolvedEnsMap, setResolvedEnsMap] = useState<Record<string, string>>({});
  const [poolTelemetry, setPoolTelemetry] = useState<UniswapV3Pool | null>(null);
  const [relayHealth, setRelayHealth] = useState<RelayHealthStatus | null>(null);

  // IsholaAtotimati / Uniswap Swap Direction Selector State (Default: ETH -> USDC)
  const [selectedDirection, setSelectedDirection] = useState<SwapDirectionOption>(SWAP_DIRECTIONS[0]);
  const [isDirectionMenuOpen, setIsDirectionMenuOpen] = useState<boolean>(false);

  // Web3 MetaMask Authorization Hook - scoped specifically to MEV Threat Dashboard
  const wallet = useWeb3Wallet();

  const partnerBackendUrl = useMemo(() => {
    return (import.meta.env.VITE_PARTNER_BACKEND_URL as string || '').trim();
  }, []);

  const cloudBackendUrl = useMemo(() => {
    return (
      (import.meta.env.VITE_MY_DEPLOYED_BACKEND_URL as string) ||
      (import.meta.env.VITE_RISK_ENGINE_BACKEND_URL as string) ||
      ''
    ).trim();
  }, []);

  // Poll live backend events with 3-tier failover chain (Primary -> Cloud -> Local)
  useEffect(() => {
    let isMounted = true;
    const pollBackend = async () => {
      try {
        const { payloads, activeSource } = await fetchLiveThreatPayloads(partnerBackendUrl, cloudBackendUrl);
        if (isMounted) {
          if (payloads.length > 0) {
            setLiveBackendPayloads(payloads);
            setIsBackendConnected(true);
            setActiveBackendSource(activeSource);
          } else {
            setIsBackendConnected(false);
            setActiveBackendSource('local');
          }
        }
      } catch {
        if (isMounted) {
          setIsBackendConnected(false);
          setActiveBackendSource('local');
        }
      }
    };

    pollBackend();
    const interval = setInterval(pollBackend, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [partnerBackendUrl, cloudBackendUrl]);

  // Reset analyzed payload when account or selected direction changes
  useEffect(() => {
    setAnalyzedPayload(null);
  }, [wallet.account, selectedDirection]);

  // Asynchronous ENS resolution for wallet addresses
  useEffect(() => {
    let isMounted = true;
    const resolveAddresses = async () => {
      const addressesToResolve: string[] = [];
      if (wallet.account) addressesToResolve.push(wallet.account);

      const scenarioNodes = ATTACK_SCENARIOS[currentScenario]?.visualization?.nodes || [];
      scenarioNodes.forEach(n => {
        if (n.details?.address) addressesToResolve.push(n.details.address);
      });

      for (const addr of addressesToResolve) {
        if (!addr || resolvedEnsMap[addr.toLowerCase()]) continue;
        try {
          const resolved = await ensService.lookupAddress(addr);
          if (resolved && isMounted) {
            setResolvedEnsMap(prev => ({ ...prev, [addr.toLowerCase()]: resolved }));
          }
        } catch {
          // Ignore lookup failure
        }
      }
    };
    resolveAddresses();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.account, currentScenario]);

  // Fetch Uniswap V3 Subgraph Pool Data & Depth Analysis
  useEffect(() => {
    let isMounted = true;
    const fetchPoolInfo = async () => {
      try {
        const poolAddr = CANONICAL_POOLS.USDC_ETH_005;
        const poolData = await uniswapService.getPoolData(poolAddr);
        if (isMounted && poolData) {
          setPoolTelemetry(poolData);
        }
      } catch {
        // Fallback pool telemetry is generated inside uniswapService
      }
    };
    fetchPoolInfo();
    return () => {
      isMounted = false;
    };
  }, [selectedDirection]);

  // Flashbots Relay Health Check
  useEffect(() => {
    let isMounted = true;
    const fetchRelayHealth = async () => {
      try {
        const health = await flashbotsService.checkRelayHealth();
        if (isMounted && health) {
          setRelayHealth(health);
        }
      } catch {
        // Fallback status handled inside flashbotsService
      }
    };
    fetchRelayHealth();
    const interval = setInterval(fetchRelayHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Triggers real risk engine analysis for connected wallet
  const handleAnalyzeSwap = useCallback(async () => {
    if (!wallet.isConnected || !wallet.account) return;
    setIsAnalyzing(true);
    try {
      const res = await getMevRiskData({
        sender: wallet.account,
        tokenIn: selectedDirection.tokenIn,
        tokenOut: selectedDirection.tokenOut,
        amountIn: 1.0,
        chainId: 1
      });

      let parsedPayload: IntentThreatPayload;
      if (res && typeof res === 'object' && 'payload' in res && (res as SwapAnalyzeResponse).payload) {
        parsedPayload = mapAnalyzeResponseToIntentThreatPayload(
          res as SwapAnalyzeResponse,
          wallet.account,
          `pool_${selectedDirection.id}`
        );
      } else if (res && typeof res === 'object' && 'visualization' in res) {
        parsedPayload = res as IntentThreatPayload;
      } else {
        parsedPayload = getLocalSimulatedPayload(wallet.account);
      }
      setAnalyzedPayload(parsedPayload);
    } catch (err) {
      console.warn('Risk analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [wallet.isConnected, wallet.account, selectedDirection]);

  // Active payload based on real risk analysis, live backend data or scenario fallback.
  // Dynamically incorporates chosen Uniswap swap direction and Web3 wallet address.
  const activePayload = useMemo(() => {
    let rawPayload: IntentThreatPayload;
    if (analyzedPayload) {
      rawPayload = analyzedPayload;
    } else if (isBackendConnected && liveBackendPayloads.length > 0) {
      rawPayload = liveBackendPayloads[0];
    } else {
      const base = ATTACK_SCENARIOS[currentScenario];
      rawPayload = {
        ...base,
        meta: {
          ...base.meta,
          blockNumber: simulatedBlock,
          timestamp: new Date().toLocaleTimeString(),
          targetPair: `${selectedDirection.tokenIn}/${selectedDirection.tokenOut} ${selectedDirection.feeTier}`
        }
      };
    }

    const connectedAccount = wallet.isConnected && wallet.account ? wallet.account : null;
    const shortAcc = connectedAccount ? `${connectedAccount.substring(0, 6)}...${connectedAccount.substring(connectedAccount.length - 4)}` : null;

    // Calculate Arc USDC protection fee based on risk score & estimated value
    const swapValueUsd = rawPayload.meta?.estimatedLossUsd || 50000;
    const riskScore = rawPayload.riskAssessment?.riskScore || 0.5;
    const feeBreakdown = arcUsdcService.calculateProtectionFee(swapValueUsd, riskScore);

    const updatedNodes = rawPayload.visualization.nodes.map(n => {
      // Update victim wallet label & intent details with resolved ENS
      if (n.type === 'WALLET' || n.id === 'victim_wallet' || n.id === 'target_intent' || n.details?.role === 'victim') {
        const addr = connectedAccount || n.details?.address || '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f';
        const ensName = (addr && resolvedEnsMap[addr.toLowerCase()]) || n.details?.ensName || (connectedAccount ? shortAcc : 'trader.eth');
        return {
          ...n,
          label: connectedAccount ? `Your Wallet (${ensName})` : `Victim Wallet (${ensName})`,
          details: {
            ...n.details,
            address: addr,
            ensName,
            intentType: `SWAP_${selectedDirection.tokenIn}_FOR_${selectedDirection.tokenOut}`,
            protectionFeeUsdc: feeBreakdown.totalProtectionFeeUsdc,
            status: connectedAccount
              ? (analyzedPayload ? (n.details?.status || 'Protected via BlotChain MEV Shield') : 'Wallet connected — analysis pending')
              : n.details?.status
          }
        };
      }
      // Update Uniswap pool node details based on selected swap direction & telemetry
      if (n.type === 'DEX_POOL' || n.id === 'dex_pool' || n.details?.role === 'pool') {
        const statusText = poolTelemetry
          ? `TVL: $${(parseFloat(poolTelemetry.totalValueLockedUSD) / 1000000).toFixed(2)}M | Tick: ${poolTelemetry.tick} | Fee: ${selectedDirection.feeTier}`
          : `Trading Pair: ${selectedDirection.tokenIn}/${selectedDirection.tokenOut} | Risk Analyzed`;
        return {
          ...n,
          label: `${selectedDirection.poolLabel} ${selectedDirection.feeTier}`,
          details: {
            ...n.details,
            status: statusText
          }
        };
      }
      // Update Contract / Block Builder / Relay node details with Flashbots relay health and Arc USDC protection fee
      if (n.type === 'CONTRACT' || n.id === 'block_builder' || n.id === 'mev_shield') {
        const relayStatusText = relayHealth
          ? `Flashbots Relay: ${relayHealth.status} (${relayHealth.latencyMs}ms, ${relayHealth.activeBuildersCount} builders)`
          : n.details?.status;
        return {
          ...n,
          details: {
            ...n.details,
            protectionFeeUsdc: feeBreakdown.totalProtectionFeeUsdc,
            status: relayStatusText
          }
        };
      }
      return n;
    });

    return {
      ...rawPayload,
      userAddress: connectedAccount || rawPayload.userAddress,
      ensName: connectedAccount ? resolvedEnsMap[connectedAccount.toLowerCase()] : rawPayload.ensName,
      visualization: {
        ...rawPayload.visualization,
        nodes: updatedNodes
      },
      meta: {
        ...rawPayload.meta,
        targetPair: `${selectedDirection.tokenIn}/${selectedDirection.tokenOut} ${selectedDirection.feeTier}`,
        protectionFeeUsdc: feeBreakdown.totalProtectionFeeUsdc
      }
    };
  }, [
    isBackendConnected,
    liveBackendPayloads,
    currentScenario,
    simulatedBlock,
    wallet.isConnected,
    wallet.account,
    selectedDirection,
    analyzedPayload,
    resolvedEnsMap,
    poolTelemetry,
    relayHealth
  ]);

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

          {/* Floating Top Controls (Web3 MetaMask Connect, Uniswap Direction Selector, Guide & Tour) */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap items-center gap-2">
            {/* MetaMask Web3 Authorization Component - Integrated exclusively into MEV Threat Dashboard */}
            <Web3WalletConnect wallet={wallet} />

            {/* Real Risk Analysis Trigger Button (Visible when wallet is connected) */}
            {wallet.isConnected && wallet.account && (
              <button
                onClick={handleAnalyzeSwap}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg border border-emerald-400/50 backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
                title="Trigger real risk engine analysis for connected wallet"
              >
                <Zap size={13} className={isAnalyzing ? 'animate-spin text-amber-300' : 'animate-pulse text-emerald-300'} />
                <span>{isAnalyzing ? 'Analyzing Swap...' : 'Analyze my swap'}</span>
              </button>
            )}

            {/* Data Source Badge: LIVE · PARTNER (green) / LIVE · CLOUD (amber) / SIMULATED · LOCAL (gray) */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg backdrop-blur-md border ${
              activeBackendSource === 'partner'
                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/50'
                : activeBackendSource === 'cloud'
                ? 'bg-amber-950/90 text-amber-400 border-amber-500/50'
                : 'bg-slate-900/90 text-slate-400 border-slate-700/60'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                activeBackendSource === 'partner'
                  ? 'bg-emerald-400 animate-pulse'
                  : activeBackendSource === 'cloud'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-400'
              }`} />
              <span>
                {activeBackendSource === 'partner' && 'LIVE · PARTNER'}
                {activeBackendSource === 'cloud' && 'LIVE · CLOUD'}
                {activeBackendSource === 'local' && 'SIMULATED · LOCAL'}
              </span>
            </div>

            {/* Uniswap Swap Direction Selector (IsholaAtotimati / Uniswap_Mev Risk Engine Integration) */}
            <div className="relative">
              <button
                onClick={() => setIsDirectionMenuOpen(!isDirectionMenuOpen)}
                className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-pink-300 hover:text-pink-200 border border-pink-500/50 hover:border-pink-400 px-3 py-1.5 rounded-full text-xs font-mono font-semibold shadow-lg backdrop-blur-md transition-all cursor-pointer"
                title="Uniswap Swap Direction Selection (IsholaAtotimati Risk Engine)"
              >
                <ArrowRightLeft size={13} className="text-pink-400 animate-pulse" />
                <span>Direction: <strong className="text-white font-bold">{selectedDirection.label}</strong></span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {isDirectionMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-3 text-xs text-slate-200 z-50 animate-fadeIn space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-pink-400">
                      <Layers size={14} />
                      <span>Uniswap Swap Direction</span>
                    </div>
                    <span className="text-[9px] bg-pink-950/90 text-pink-300 border border-pink-800 px-1.5 py-0.5 rounded font-mono">
                      Demo 1-Pass
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    Select pair direction to analyze risk on the Uniswap_Mev risk engine:
                  </p>

                  <div className="space-y-1">
                    {SWAP_DIRECTIONS.map((dir) => (
                      <button
                        key={dir.id}
                        onClick={() => {
                          setSelectedDirection(dir);
                          setIsDirectionMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left font-mono text-[11px] transition-all cursor-pointer ${
                          selectedDirection.id === dir.id
                            ? 'bg-pink-950/70 border border-pink-500/60 text-white font-bold shadow-md'
                            : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                          <span>{dir.label}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-sans">{dir.feeTier}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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

                {selectedNode.details?.ensName && (
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Tag size={11} className="text-indigo-400" /> ENS Name:
                    </span>
                    <span className="font-mono font-semibold text-indigo-300">{selectedNode.details.ensName}</span>
                  </div>
                )}

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

                {activePayload.meta?.protectionFeeUsdc !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign size={11} className="text-sky-400" /> Arc Protection Fee:
                    </span>
                    <span className="font-mono font-bold text-sky-300">{activePayload.meta.protectionFeeUsdc.toFixed(2)} USDC</span>
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

          {/* Block & Live Metrics Badge (Bottom Center) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full text-[11px] font-mono text-slate-300 shadow-xl">
            <span className={`flex items-center gap-1 ${
              activeBackendSource === 'partner' ? 'text-emerald-400' :
              activeBackendSource === 'cloud' ? 'text-sky-400' : 'text-emerald-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                activeBackendSource === 'partner' ? 'bg-emerald-500 animate-pulse' :
                activeBackendSource === 'cloud' ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'
              } inline-block`} />
              {
                activeBackendSource === 'partner' ? 'Primary Backend' :
                activeBackendSource === 'cloud' ? 'Cloud Failover Backend' :
                'MEV Shield Active'
              }
            </span>
            <span className="text-slate-600">•</span>
            <span>{activePayload.meta?.blockNumber ? `Block #${activePayload.meta.blockNumber}` : 'Live Events'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{activePayload.meta?.attackVector || 'SWAP_EVENT'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
