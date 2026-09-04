import React from 'react';
import { Connection as ConnectionType, Node, Particle as ParticleType, AnimationSettings } from '../types';

interface ConnectionProps {
  connection: ConnectionType;
  sourceNode: Node;
  targetNode: Node;
  isHighlighted: boolean;
  animationSettings: AnimationSettings;
  isDragging?: boolean;
}

const Particle: React.FC<{ 
  particle: ParticleType;
  path: string;
  animationSettings: AnimationSettings;
}> = ({ particle, path, animationSettings }) => {
  if (!animationSettings.enabled) return null;

  const baseDuration = 3;
  const duration = animationSettings.particleSpeed > 0
    ? baseDuration / animationSettings.particleSpeed
    : 0;

  if (duration === 0) return null;

  // Calculate initial offset to start particle at the correct progress
  // Using a negative begin value allows starting at an offset within the duration
  const beginValue = -particle.progress * duration;

  return (
    <circle
      r={particle.size}
      fill="white"
      opacity={0.8}
      style={{
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
      }}
    >
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${beginValue}s`}
      >
        <mpath href={`#${path.replace('#', '')}`} />
      </animateMotion>
    </circle>
  );
};

export const Connection: React.FC<ConnectionProps> = React.memo(({
  connection, 
  sourceNode,
  targetNode,
  isHighlighted,
  animationSettings,
  isDragging
}) => {
  if (!sourceNode || !targetNode) return null;

  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
  
  const ux = dx / distance;
  const uy = dy / distance;

  // Offset the start and end coordinates by the node radius plus a 20% protective collision buffer
  const startOffset = sourceNode.size * 1.20;
  const endOffset = targetNode.size * 1.20;

  const startX = sourceNode.x + ux * startOffset;
  const startY = sourceNode.y + uy * startOffset;
  const endX = targetNode.x - ux * endOffset;
  const endY = targetNode.y - uy * endOffset;

  // Control points for Bézier curve using the adjusted coordinates
  const adjustedDx = endX - startX;
  const adjustedDy = endY - startY;
  const adjustedDistance = Math.sqrt(adjustedDx * adjustedDx + adjustedDy * adjustedDy) || 0.001;

  const controlOffset = adjustedDistance * 0.3;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const perpX = -adjustedDy / adjustedDistance * controlOffset;
  const perpY = adjustedDx / adjustedDistance * controlOffset;

  const pathId = `path-${connection.id}`;
  const pathData = `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`;
  
  const strokeWidth = Math.max(2, Math.min(12, connection.flow / 5000000));
  const color = connection.direction === 'in' ? '#3b82f6' : '#f97316';
  const opacity = isHighlighted ? 1 : 0.6;
  const isDraggingAny = isDragging || false;

  return (
    <g>
      {/* Connection path definition */}
      <defs>
        <path id={pathId.replace('#', '')} d={pathData} />
        <linearGradient id={`gradient-${connection.id}`} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.3} />
        </linearGradient>
      </defs>
      
      {/* Main connection line */}
      <path
        d={pathData}
        stroke={`url(#gradient-${connection.id})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        opacity={opacity}
        style={{
          transition: isDraggingAny ? 'none' : 'all 0.8s ease-in-out',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}
      />
      
      {/* Pulsing effect for active connections */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth + 2}
        fill="none"
        strokeLinecap="round"
        opacity={0.2}
        style={{
          transition: isDraggingAny ? 'none' : 'all 0.8s ease-in-out'
        }}
      >
        <animate
          attributeName="opacity"
          values="0.2;0.5;0.2"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
      
      {/* Moving particles */}
      {animationSettings.enabled && connection.particles.map(particle => (
        <Particle
          key={particle.id}
          particle={particle}
          path={`#${pathId.replace('#', '')}`}
          animationSettings={animationSettings}
        />
      ))}
      
      {/* Flow direction indicator */}
      <circle
        cx={endX}
        cy={endY}
        r="6"
        fill={color}
        opacity={opacity * 0.8}
        style={{
          transition: isDraggingAny ? 'none' : 'all 0.8s ease-in-out'
        }}
      />
    </g>
  );
});

Connection.displayName = 'Connection';
