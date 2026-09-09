/**
 * BlotChain-MEVShield: ENSv2 Universal Resolver Integration
 * ETHOnline 2026 (Continuity Track)
 * 
 * Provides high-performance cached reverse & forward ENS name resolution,
 * text record lookups, avatar resolution, and batch resolution for Three.js
 * canvas rendering in ThreatVisualizer3D.
 */

import { createPublicClient, http, Address, isAddress } from 'viem';
import { mainnet } from 'viem/chains';
import { ThreatNode } from '../types/mev';

export interface EnsResolutionResult {
  address: Address;
  name: string | null;
  avatarUrl?: string | null;
  cached: boolean;
  resolvedAt: number;
}

export interface EnsCacheEntry {
  name: string | null;
  avatarUrl?: string | null;
  expiresAt: number;
}

const DEFAULT_RPC = import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://cloudflare-eth.com';
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes TTL
const MAX_CACHE_ENTRIES = 500;

export class EnsService {
  private client;
  private cache: Map<string, EnsCacheEntry> = new Map();
  private inFlightRequests: Map<string, Promise<string | null>> = new Map();

  constructor(rpcUrl: string = DEFAULT_RPC) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl, {
        retryCount: 2,
        timeout: 8000
      })
    });

    this.restoreCacheFromSession();
  }

  /**
   * Restores previously resolved names from sessionStorage if available.
   */
  private restoreCacheFromSession(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      const stored = sessionStorage.getItem('blotchain_ens_cache');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, EnsCacheEntry>;
        const now = Date.now();
        Object.entries(parsed).forEach(([addr, entry]) => {
          if (entry.expiresAt > now) {
            this.cache.set(addr.toLowerCase(), entry);
          }
        });
      }
    } catch {
      // Ignore storage restore issues
    }
  }

  /**
   * Persists cache to sessionStorage for seamless re-render experience.
   */
  private persistCacheToSession(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      const serialized: Record<string, EnsCacheEntry> = {};
      this.cache.forEach((entry, key) => {
        serialized[key] = entry;
      });
      sessionStorage.setItem('blotchain_ens_cache', JSON.stringify(serialized));
    } catch {
      // Ignore storage write issues
    }
  }

  /**
   * Reverse resolves an Ethereum address to its primary ENS name (e.g., trader.eth).
   * Features in-memory LRU caching and in-flight promise pooling.
   */
  public async lookupAddress(address: string): Promise<string | null> {
    if (!isAddress(address)) {
      return null;
    }

    const normalized = address.toLowerCase() as Address;

    // 1. Check in-memory cache
    const cached = this.cache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.name;
    }

    // 2. Return active in-flight promise if duplicate call occurs simultaneously
    if (this.inFlightRequests.has(normalized)) {
      return this.inFlightRequests.get(normalized)!;
    }

    // 3. Initiate resolution request
    const promise = (async (): Promise<string | null> => {
      try {
        const ensName = await this.client.getEnsName({
          address: normalized
        });

        this.setCache(normalized, ensName);
        return ensName;
      } catch (err) {
        console.warn(`ENS reverse resolution failed for ${address}:`, err);
        // Cache negative result with shorter TTL (2 mins) to prevent query spamming
        this.setCache(normalized, null, 1000 * 60 * 2);
        return null;
      } finally {
        this.inFlightRequests.delete(normalized);
      }
    })();

    this.inFlightRequests.set(normalized, promise);
    return promise;
  }

  /**
   * Forward resolves an ENS domain name to its corresponding Ethereum address.
   */
  public async resolveName(ensName: string): Promise<Address | null> {
    if (!ensName || !ensName.includes('.')) {
      return null;
    }

    try {
      const address = await this.client.getEnsAddress({
        name: ensName
      });
      return address as Address | null;
    } catch (err) {
      console.warn(`ENS forward resolution failed for ${ensName}:`, err);
      return null;
    }
  }

  /**
   * Fetches an ENS text record or avatar URL for verified web3 identities.
   */
  public async getEnsAvatar(ensName: string): Promise<string | null> {
    try {
      return await this.client.getEnsAvatar({
        name: ensName
      });
    } catch {
      return null;
    }
  }

  /**
   * Batch resolves multiple addresses concurrently with deduplication.
   */
  public async resolveBatch(addresses: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    const uniqueAddresses = Array.from(new Set(addresses.filter(isAddress)));

    await Promise.all(
      uniqueAddresses.map(async addr => {
        const name = await this.lookupAddress(addr);
        results.set(addr, name);
      })
    );

    return results;
  }

  /**
   * Utility to format an address nicely: returns ENS name if present,
   * otherwise formats as a clean 0x1234...5678 address string.
   */
  public formatAddressDisplay(address: string, ensName?: string | null): string {
    if (ensName) return ensName;
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Enriches a ThreatNode with human-readable ENS labels for Three.js spatial rendering.
   */
  public async enrichThreatNodeWithEns(node: ThreatNode): Promise<ThreatNode> {
    if (!node.details?.address || !isAddress(node.details.address)) {
      return node;
    }

    const ensName = await this.lookupAddress(node.details.address);
    if (!ensName) {
      return node;
    }

    return {
      ...node,
      label: `${ensName} (${node.details.role || node.type})`,
      details: {
        ...node.details,
        status: `${node.details.status || 'ACTIVE'} [ENS: ${ensName}]`
      }
    };
  }

  private setCache(address: string, name: string | null, customTtl?: number): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      // LRU eviction of earliest key
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(address, {
      name,
      expiresAt: Date.now() + (customTtl || CACHE_TTL_MS)
    });

    this.persistCacheToSession();
  }
}

export const ensService = new EnsService();
