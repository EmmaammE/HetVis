/* eslint-disable prefer-destructuring */
import React, { useMemo } from 'react';
import * as d3 from 'd3';

export interface OverviewData {
  // server\local的降维后坐标，cosine值
  server: number[][];
  local: number[][];
  cosines: number[];
  // 起点
  weight0: number[];
}

interface OverviewProps {
  data: OverviewData;
  // 是否额外加起始点(true加)
  flag: boolean;
  // 当前分析的round在range范围内的下标
  round: number;
  colorExtent: any;
}

const SIZE = 400;
const PADDING = 10;

const mergeDomain = (...datum: number[][]) => [
  Math.min(Math.min(...datum.map((d) => d[0]))),
  Math.max(Math.max(...datum.map((d) => d[1]))),
];

function Overview({ data, flag, round, colorExtent }: OverviewProps) {
  const color = d3.scaleLinear<string>().domain(colorExtent).range(['#efefef', '#aa815d']);

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([PADDING, SIZE - PADDING])
        .domain(
          flag
            ? mergeDomain(
                d3.extent([...data.local, ...data.server, data.weight0], (d) => d[0]) as any
              )
            : mergeDomain(d3.extent([...data.local, ...data.server], (d) => d[0]) as any)
        ),
    [data.local, data.server, data.weight0, flag]
  );

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([SIZE - PADDING, PADDING])
        .domain(
          flag
            ? mergeDomain(
                d3.extent([...data.local, ...data.server, data.weight0], (d) => d[1]) as any
              )
            : mergeDomain(d3.extent([...data.local, ...data.server], (d) => d[1]) as any)
        ),
    [data.local, data.server, data.weight0, flag]
  );

  // console.log(xScale(0), yScale(0), '初始值');
  const colorScaleLinear = d3
    .scaleSequential(d3.interpolateRgb('#efefef', '#333'))
    .domain([0, data.server.length - 1]);

  return (
    <div id="Overview">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          {data.cosines.map((v, i) => (
            <marker
              id={`marker-${i}`}
              key={`marker-${i}`}
              refX="6 "
              refY="6"
              viewBox="0 0 16 16"
              markerWidth="10"
              markerHeight="10"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M 0 0 12 6 0 12 3 6 Z" fill={color(v)} />
            </marker>
          ))}
        </defs>
        <rect
          height="100%"
          width="100%"
          strokeWidth="2"
          strokeDasharray="2"
          fill="none"
          stroke="#000"
        />
        <g>
          {data.local.map((point, i) => {
            const prev = i >= 1 ? data.server[i - 1] : data.weight0;

            return (
              <line
                key={`local${i}`}
                markerEnd={`url(#marker-${i})`}
                stroke={color(data.cosines[i])}
                x1={xScale(prev[0])}
                x2={xScale(point[0])}
                y1={yScale(prev[1])}
                y2={yScale(point[1])}
                id={`${data.cosines[i]}`}
              />
            );
          })}
        </g>

        <g>
          {data.server.map((point, i) => {
            const prev = i >= 1 ? data.server[i - 1] : data.weight0;
            return (
              <line
                id={`${i}`}
                key={`path${i}`}
                stroke={colorScaleLinear(i)}
                strokeWidth={2}
                // {...pro}
                x1={xScale(prev[0])}
                x2={xScale(point[0])}
                y1={yScale(prev[1])}
                y2={yScale(point[1])}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {data.server[round] && (
          <circle
            cx={xScale(data.server[round][0])}
            cy={yScale(data.server[round][1])}
            r={3}
            fill="#fff"
            stroke="#000"
          />
        )}
      </svg>
    </div>
  );
}

export default Overview;
