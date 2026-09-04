import { Particle } from '../types';

export function calculateNodeSize(liquidity: number, viewportWidth: number = 1280, isHub: boolean = false): number {
  // Logarithmic scaling for visual distribution
  const isMobile = viewportWidth <= 480;
  const isTablet = viewportWidth > 480 && viewportWidth <= 1024;

  const minSize = isMobile ? 12 : isTablet ? 16 : 20;
  const maxSize = isMobile ? 26 : isTablet ? 38 : 50;
  const logLiquidity = Math.log10(Math.max(1, liquidity));
  const normalizedSize = (logLiquidity - 6) / (12 - 6); // Normalize between 1M and 1T
  const clampedNorm = Math.max(0, Math.min(1, normalizedSize));
  const baseSize = minSize + clampedNorm * (maxSize - minSize);

  if (!isHub) return Math.round(baseSize);
  return Math.round(Math.min(maxSize * 1.25, baseSize * 1.2));
}

export function getNodeColor(change24h: number, change7d: number): string {
  if (Math.abs(change24h) > 15 || Math.abs(change7d) > 30) {
    return '#eab308'; // Yellow for high volatility
  }
  if (change24h > 3) {
    return '#22c55e'; // Green for growth
  }
  if (change24h < -3) {
    return '#ef4444'; // Red for decline
  }
  return '#6b7280'; // Gray for stable
}

export function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `particle-${i}-${Math.random().toString(36).substr(2, 9)}`,
    progress: Math.random(),
    speed: 0.008 + Math.random() * 0.015,
    size: 3 + Math.random() * 3
  }));
}
