import React from 'react';
import * as d3 from 'd3';

export const WIDTH = 60;
export const HEIGHT = 60;

export const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
interface HeatmapProps {
  // cpArray: number[][],
  // data: number[][],
  // 异构点的序号
  // heteroIndex: number[],
  // 计算后的密度多边形
  densityData: any[];
  linear: any;
  // 异构点的坐标
  heteroPoints: any;
}

const color = d3.scaleLinear<string>().domain([0, 0.2, 1]).range(['#fff', '#ccc', '#666']);

const Heatmap = ({ densityData, linear, heteroPoints }: HeatmapProps) => {
  const width = WIDTH - MARGIN.left - MARGIN.right;
  const height = HEIGHT - MARGIN.bottom - MARGIN.right;

  const hull = d3.polygonHull(heteroPoints as any);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%">
      <defs>
        <clipPath id="cut-off">
          <rect x={0} y={0} width={width} height={height} />
        </clipPath>
      </defs>

      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        <g clipPath="url(#cut-off)">
          {densityData.map((d, i) => (
            <path d={d3.geoPath()(d) as string} key={i} fill={color(linear(d.value))} />
          ))}
        </g>

        {hull ? (
          <path
            d={`M${hull.join('L')}Z`}
            // fill="var(--primary-color)"
            fill="none"
            strokeWidth={2}
            stroke="var(--primary-color)"
          />
        ) : (
          heteroPoints.map((point: any, i: number) => (
            <circle key={i} cx={point[0]} cy={point[1]} r={2} fill="var(--primary-color)" />
          ))
        )}
      </g>

      {/* <rect
        x={MARGIN.left}
        y={MARGIN.top}
        width={width}
        height={height}
        fill="none"
        stroke="#000"
      /> */}
    </svg>
  );
};

// export default React.memo(Heatmap);
export default Heatmap;
