import { useState, useEffect, useCallback } from 'react';

export interface Web3WalletState {
  account: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  hasMetaMask: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => void;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWeb3Wallet(): Web3WalletState {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hasMetaMask = typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask || window.ethereum);

  // Check initial connection status on mount
  useEffect(() => {
    if (!window.ethereum) return;

    let isMounted = true;

    // Fetch connected accounts if authorized
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (!isMounted) return;
        const accs = accounts as string[];
        if (accs && accs.length > 0) {
          setAccount(accs[0]);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch eth_accounts:', err);
      });

    // Fetch chainId
    window.ethereum.request({ method: 'eth_chainId' })
      .then((chain) => {
        if (!isMounted) return;
        setChainId(chain as string);
      })
      .catch((err) => {
        console.warn('Failed to fetch eth_chainId:', err);
      });

    // Event listeners
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs && accs.length > 0) {
        setAccount(accs[0]);
        setError(null);
      } else {
        setAccount(null);
      }
    };

    const handleChainChanged = (chain: unknown) => {
      setChainId(chain as string);
    };

    const handleDisconnect = () => {
      setAccount(null);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      isMounted = false;
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask browser extension.');
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts'
      })) as string[];

      if (accounts && accounts.length > 0) {
        const selectedAccount = accounts[0];
        setAccount(selectedAccount);

        const currentChainId = (await window.ethereum.request({
          method: 'eth_chainId'
        })) as string;
        setChainId(currentChainId);

        setIsConnecting(false);
        return selectedAccount;
      } else {
        setError('No account selected');
        setIsConnecting(false);
        return null;
      }
    } catch (err: unknown) {
      const ethError = err as { message?: string; code?: number };
      const errorMessage = ethError.code === 4001
        ? 'User rejected connection request'
        : ethError.message || 'Failed to connect MetaMask';
      setError(errorMessage);
      setIsConnecting(false);
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  return {
    account,
    chainId,
    isConnected: Boolean(account),
    isConnecting,
    error,
    hasMetaMask,
    connect,
    disconnect
  };
}
