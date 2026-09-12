import React, { useState } from 'react';
import { Wallet, LogOut, ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck, Coins, RefreshCw, Copy, Check, X } from 'lucide-react';
import { Web3WalletState } from '../hooks/useWeb3Wallet';

interface Web3WalletConnectProps {
  wallet: Web3WalletState;
  className?: string;
}

interface TokenBalanceItem {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  color: string;
  iconBg: string;
}

export const Web3WalletConnect: React.FC<Web3WalletConnectProps> = ({ wallet, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleCopyAddress = () => {
    if (wallet.account) {
      navigator.clipboard.writeText(wallet.account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    await wallet.refetchBalance();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const ethBalanceNum = parseFloat(wallet.balanceEth || '0.0000');
  const ethUsd = (ethBalanceNum * 2800).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tokenBalances: TokenBalanceItem[] = [
    {
      symbol: 'ETH',
      name: 'Ethereum Native',
      balance: `${wallet.balanceEth ?? '0.0000'} ETH`,
      usdValue: `$${ethUsd}`,
      color: 'text-purple-400',
      iconBg: 'bg-purple-950/80 border-purple-800/60'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '1,250.00 USDC',
      usdValue: '$1,250.00',
      color: 'text-blue-400',
      iconBg: 'bg-blue-950/80 border-blue-800/60'
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      balance: '0.850 WETH',
      usdValue: '$2,380.00',
      color: 'text-indigo-400',
      iconBg: 'bg-indigo-950/80 border-indigo-800/60'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      balance: '450.00 USDT',
      usdValue: '$450.00',
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-950/80 border-emerald-800/60'
    },
    {
      symbol: 'UNI',
      name: 'Uniswap Governance',
      balance: '120.00 UNI',
      usdValue: '$960.00',
      color: 'text-pink-400',
      iconBg: 'bg-pink-950/80 border-pink-800/60'
    }
  ];

  const getNetworkName = (chainId: string | null) => {
    if (!chainId) return 'Unknown Network';
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x89':
        return 'Polygon Mainnet';
      case '0xa4b1':
        return 'Arbitrum One';
      case '0xa':
        return 'Optimism';
      case '0xaa36a7':
        return 'Sepolia Testnet';
      case '0x13882':
      case '0x80002':
        return 'Polygon Amoy';
      default:
        return `Chain ID: ${parseInt(chainId, 16) || chainId}`;
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {!wallet.isConnected ? (
        <button
          onClick={wallet.connect}
          disabled={wallet.isConnecting}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:via-orange-500 hover:to-red-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-orange-950/40 border border-orange-400/40 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Wallet size={14} className="animate-pulse" />
          <span>{wallet.isConnecting ? 'Connecting MetaMask...' : 'Connect MetaMask (MEV Web3)'}</span>
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-emerald-500/50 hover:border-emerald-400 px-3 py-1.5 rounded-full text-xs font-mono font-semibold shadow-lg backdrop-blur-md transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>{formatAddress(wallet.account!)}</span>
          </button>

          {isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div
                className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-thin text-xs text-slate-200 animate-fadeIn space-y-4 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 size={17} />
                    <span>Web3 Authorized Wallet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                      MEV Active
                    </span>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

              {/* Account Address Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Connected Wallet:</span>
                  <span className="text-[10px] text-amber-400 font-medium">{getNetworkName(wallet.chainId)}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-xl border border-slate-800/90">
                  <span className="font-mono text-white text-[11px] truncate pr-1">{wallet.account}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Copy Address"
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                    <a
                      href={`https://etherscan.io/address/${wallet.account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="View on Etherscan"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Token Balances Under Address */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                    <Coins size={14} className="text-amber-400" />
                    <span>Token Balances</span>
                  </div>
                  <button
                    onClick={handleRefreshBalances}
                    disabled={isRefreshing}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 cursor-pointer disabled:opacity-50"
                    title="Refresh Balance"
                  >
                    <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-amber-400' : ''} />
                    <span>Sync</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {tokenBalances.map((item) => (
                    <div
                      key={item.symbol}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[11px] font-mono ${item.iconBg} ${item.color}`}>
                          {item.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-xs leading-tight">{item.symbol}</div>
                          <div className="text-[10px] text-slate-400">{item.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-xs">{item.balance}</div>
                        <div className="text-[10px] text-slate-400">{item.usdValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disconnect Action */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    wallet.disconnect();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {wallet.error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-950/90 border border-red-500/60 text-red-200 text-[11px] p-2 rounded-xl shadow-xl flex items-center gap-1.5 z-50">
          <AlertTriangle size={13} className="shrink-0 text-red-400" />
          <span className="truncate">{wallet.error}</span>
        </div>
      )}
    </div>
  );
};
