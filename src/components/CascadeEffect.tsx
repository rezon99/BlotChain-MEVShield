import React, { useEffect, useState } from 'react';

interface CascadeEffectProps {
  x: number;
  y: number;
  trigger: number;
  onComplete: () => void;
}

export const CascadeEffect: React.FC<CascadeEffectProps> = ({ 
  x, 
  y, 
  trigger, 
  onComplete 
}) => {
  const [rings, setRings] = useState<Array<{ id: string; radius: number; opacity: number }>>([]);

  useEffect(() => {
    if (trigger === 0) return;

    let animId: number;
    const newRings = Array.from({ length: 3 }, (_, i) => ({
      id: `ring-${trigger}-${i}`,
      radius: 0,
      opacity: 0.6
    }));

    setRings(newRings);

    const animateRings = () => {
      let frame = 0;
      const animate = () => {
        frame++;
        setRings(currentRings => 
          currentRings.map((ring, i) => ({
            ...ring,
            radius: (frame * 3) + (i * 30),
            opacity: Math.max(0, 0.6 - (frame * 0.01) - (i * 0.2))
          }))
        );

        if (frame < 100) {
          animId = requestAnimationFrame(animate);
        } else {
          setRings([]);
          onComplete();
        }
      };
      animId = requestAnimationFrame(animate);
    };

    animateRings();

    return () => {
      if (typeof animId === 'number') {
        cancelAnimationFrame(animId);
      }
    };
  }, [trigger, onComplete]);

  return (
    <g>
      {rings.map(ring => (
        <circle
          key={ring.id}
          cx={x}
          cy={y}
          r={ring.radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="2"
          opacity={ring.opacity}
        />
      ))}
    </g>
  );
};
