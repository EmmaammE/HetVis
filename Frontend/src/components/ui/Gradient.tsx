import React from 'react';
import * as d3 from 'd3';

export interface GradientProps {
  colors: string[];
  legends: string[] | number[];
  width?: string;
  height?: number;
  ratio?: string[] | null;
}

const Gradient = ({ colors, legends, width, height, ratio }: GradientProps) => {
  const scale = d3
    .scaleLinear<string>()
    .domain(Array.from({ length: colors.length }, (d, i) => i))
    .range(ratio || ['0%', '100%']);

  return (
    <div className="legend-wrapper">
      <p>{legends[0]}</p>
      <svg width={width || '120px'} viewBox={`0 0 ${width ? 80 : 120} ${height || 15}`}>
        <defs>
          <linearGradient id={colors.join('').slice(1)} x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.map((color, i) => (
              <stop offset={scale(i)} stopColor={color} key={color} />
            ))}
          </linearGradient>
        </defs>
        <rect x="0%" y="0" width="100%" height="100%" fill={`url(#${colors.join('').slice(1)})`} />
      </svg>
      <p>{legends[1]}</p>
    </div>
  );
};

export default React.memo(Gradient);
