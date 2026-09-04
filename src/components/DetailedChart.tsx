import React, { useMemo } from 'react';

interface DetailedChartProps {
  data: [number, number][];
  width: number;
  height: number;
  color: string;
}

export const DetailedChart: React.FC<DetailedChartProps> = ({ data, width, height, color }) => {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';

    const prices = data.map(d => d[1]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d[1] - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  }, [data, width, height]);

  const gradientId = `chart-gradient-${color.replace('#', '')}`;

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 italic">
        Insufficient historical data
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line
            key={v}
            x1="0"
            y1={v * height}
            x2={width}
            y2={v * height}
            stroke="white"
            strokeOpacity="0.05"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path
          d={`M 0,${height} L ${points} L ${width},${height} Z`}
          fill={`url(#${gradientId})`}
        />

        {/* Main line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
        />
      </svg>
    </div>
  );
};
