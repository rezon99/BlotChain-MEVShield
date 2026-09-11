import React, { useState } from 'react';
import { Wallet, LogOut, ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Web3WalletState } from '../hooks/useWeb3Wallet';

interface Web3WalletConnectProps {
  wallet: Web3WalletState;
  className?: string;
}

export const Web3WalletConnect: React.FC<Web3WalletConnectProps> = ({ wallet, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

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
            <div className="absolute right-0 mt-2 w-72 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-xs text-slate-200 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 size={15} />
                  <span>Web3 Authorized</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  MEV Active
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Connected Account:</span>
                  <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800 mt-1">
                    <span className="font-mono text-white text-[11px] truncate">{wallet.account}</span>
                    <a
                      href={`https://etherscan.io/address/${wallet.account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white ml-1 shrink-0"
                      title="View on Etherscan"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400 text-[11px]">Network:</span>
                  <span className="font-semibold text-amber-400">{getNetworkName(wallet.chainId)}</span>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => {
                    wallet.disconnect();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 py-1.5 px-3 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Disconnect</span>
                </button>
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
