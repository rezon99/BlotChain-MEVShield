import React, { useState, useEffect } from 'react';
import { Node as NodeType, AnimationSettings } from '../types';

interface NodeProps {
  node: NodeType;
  onSelect: (nodeId: string) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onHover: (node: NodeType, x: number, y: number) => void;
  onHoverEnd: () => void;
  isConnected: boolean;
  animationSettings: AnimationSettings;
  isDragging?: boolean;
}

export const Node: React.FC<NodeProps> = React.memo(({
  node, 
  onSelect,
  onDragStart,
  onHover, 
  onHoverEnd, 
  isConnected,
  animationSettings,
  isDragging = false
}) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Scale animation when node data changes
    if (Math.abs(node.change24h) > 15) {
      setScale(1.1);
      const timer = setTimeout(() => setScale(1), 300);
      return () => clearTimeout(timer);
    }
  }, [node.lastUpdated, node.change24h]);

  const opacity = node.isSelected || isConnected ? 1 : 0.8;
  const glowIntensity = node.isSelected ? 15 : 0;
  const [dragStarted, setDragStarted] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const breathingIntensity = animationSettings.enabled ? animationSettings.breathingIntensity : 0;
  const transformStyle = {
    '--breathing-intensity': breathingIntensity,
    '--transform-origin-x': `${node.x}px`,
    '--transform-origin-y': `${node.y}px`,
    transform: `scale(${scale})`,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isConnected || node.isSelected ? 1 : 0.9,
    filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.3)) ${node.isSelected ? `drop-shadow(0 0 ${glowIntensity}px ${node.color})` : ''}`,
    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
  } as React.CSSProperties;

  return (
    <g
      className={breathingIntensity > 0 ? 'animate-breathe' : ''}
      style={transformStyle}
      onMouseDown={(e) => {
        setDragStarted(false);
        setMouseDownPos({ x: e.clientX, y: e.clientY });
        onDragStart(e);
      }}
      onClick={(e) => {
        // Only trigger selection if we didn't drag
        if (!dragStarted) {
          onSelect(node.id);
        }
        e.stopPropagation();
      }}
      onMouseMove={(e) => {
        if (!dragStarted && (Math.abs(e.clientX - mouseDownPos.x) > 5 || Math.abs(e.clientY - mouseDownPos.y) > 5)) {
          setDragStarted(true);
        }
      }}
      onMouseEnter={(e) => {
        const rect = (e.target as SVGElement).getBoundingClientRect();
        onHover(node, rect.left + rect.width / 2, rect.top - 10);
      }}
      onMouseLeave={onHoverEnd}
    >
      {node.image ? (
        <g>
          <defs>
            <clipPath id={`clip-${node.id}`}>
              <circle cx={node.x} cy={node.y} r={node.size} />
            </clipPath>
          </defs>
          <image
            xlinkHref={node.image}
            x={node.x - node.size}
            y={node.y - node.size}
            width={node.size * 2}
            height={node.size * 2}
            clipPath={`url(#clip-${node.id})`}
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={node.size}
            fill="none"
            stroke={node.color}
            strokeWidth={node.isSelected ? 4 : 2}
            opacity={opacity}
            style={{
              transition: isDragging ? 'none' : 'all 0.8s ease-in-out',
              pointerEvents: 'none'
            }}
          />
        </g>
      ) : (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.size}
          fill={node.color}
          opacity={opacity}
          style={{
            transition: isDragging ? 'none' : 'all 0.8s ease-in-out',
            strokeWidth: node.isSelected ? 3 : 0,
            stroke: node.isSelected ? '#ffffff' : 'none'
          }}
        />
      )}
      
      {/* Inner glow effect */}
      {!node.image && (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.size * 0.7}
          fill={node.color}
          opacity={0.3}
          style={{
            transition: isDragging ? 'none' : 'all 0.8s ease-in-out',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Node label */}
      <text
        x={node.x}
        y={node.y + node.size + 20}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="500"
        opacity={node.isSelected || isConnected ? 1 : 0.7}
        style={{
          transition: 'opacity 0.3s ease'
        }}
      >
        {node.name}
      </text>
      
      {/* Category label */}
      <text
        x={node.x}
        y={node.y + node.size + 35}
        textAnchor="middle"
        fill="#9ca3af"
        fontSize="10"
        opacity={node.isSelected || isConnected ? 0.8 : 0.5}
        style={{
          transition: 'opacity 0.3s ease'
        }}
      >
        {node.category}
      </text>
    </g>
  );
});

Node.displayName = 'Node';
