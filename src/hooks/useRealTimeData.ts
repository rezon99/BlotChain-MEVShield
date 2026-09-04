import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Connection, DashboardMode } from '../types';
import { coinGeckoApi } from '../services/coinGeckoApi';
import {
  transformCoinDataToNodes,
  generateConnectionsFromRealData,
  transformNFTDataToNodes,
  generateNFTConnections
} from '../utils/dataTransformer';
import {
  generateMockNodes,
  generateMockConnections
} from '../utils/dataSimulator';

export function useRealTimeData(mode: DashboardMode = 'crypto', refreshInterval: number = 30000) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const activeFetchId = useRef(0);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const fetchData = useCallback(async () => {
    const fetchId = ++activeFetchId.current;
    try {
      setLoading(true);
      setError(null);
      
      let newNodes: Node[] = [];
      let newConnections: Connection[] = [];

      if (mode === 'crypto') {
        const [coinsData, exchangesData] = await Promise.all([
          coinGeckoApi.getTopCoins(15),
          coinGeckoApi.getExchanges(5)
        ]);
        if (fetchId !== activeFetchId.current) return;
        newNodes = transformCoinDataToNodes(coinsData, exchangesData);
        newConnections = generateConnectionsFromRealData(newNodes);
      } else {
        const nftData = await coinGeckoApi.getNFTMarkets(20);
        if (fetchId !== activeFetchId.current) return;
        newNodes = transformNFTDataToNodes(nftData);
        newConnections = generateNFTConnections(newNodes);
      }

      if (fetchId !== activeFetchId.current) return;

      setNodes(newNodes);
      setConnections(newConnections);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      if (fetchId !== activeFetchId.current) return;
      console.error('Failed to fetch data:', err);
      if (nodesRef.current.length === 0) {
        const fallback = generateMockNodes();
        setNodes(fallback);
        setConnections(generateMockConnections(fallback));
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  }, [mode]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update data based on refresh interval
  useEffect(() => {
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    nodes,
    connections,
    loading,
    error,
    lastUpdate,
    refetch: fetchData
  };
}
