import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Triangle from '../markers/Triangle';

export interface LineChartProps {
  margin: {
    r: number;
    b: number;
    l: number;
    t: number;
  };
  data: number[][];
  time: number[];
}

const WIDTH = 550;
const HEIGHT = 350;
// 两个图中间显示的空隙的一半
const PADDING = 15;
const R = 5;

const LineChart = ({ margin, data, time }: LineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  const $lines = useRef(null);

  const xScale = d3
    .scaleLinear()
    .range([0, widthMap])
    .domain([time[0], time[time.length - 1]])
    .nice();

  // for loss(显示在图上方)
  const yScale = d3
    .scaleSymlog()
    .range([heightMap / 2 - PADDING, 0])
    .domain([0, d3.max(data.flat()) as number])
    .nice();
  // const yScale = d3.scaleLinear().range([heightMap, 0]).domain([0, 10000000])

  const yScale2 = d3
    .scaleSymlog()
    .range([heightMap, heightMap / 2 - PADDING])
    .domain([0, d3.max(data.flat()) as number])
    .nice();

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const line = d3
    .line()
    .x((d, i) => xScale(time[i]))
    .y((d: any) => yScale(d));

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(3);

    d3.select($xaxis.current).call(xAxis.scale(xScale));

    d3.select($yaxis.current).append('g').call(yAxis.scale(yScale));
    d3.select($yaxis.current).append('g').call(yAxis.scale(yScale2));

    const d3lines = d3.select($lines.current);

    d3lines.append('g').call(
      d3
        .axisLeft(yScale)
        .ticks(3)
        .tickSize(-widthMap)
        .tickFormat('' as any) as any
    );
    d3lines.append('g').call(
      d3
        .axisLeft(yScale2)
        .ticks(3)
        .tickSize(-widthMap)
        .tickFormat('' as any) as any
    );
    d3lines.append('g').call(
      d3
        .axisBottom(xScale)
        .ticks(10)
        .tickSize(heightMap)
        .tickFormat('' as any) as any
    );
  }, [data, time, widthMap, xScale, yScale, $lines, yScale2, heightMap]);

  return (
    <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <Triangle />
      </defs>
      {/* <g transform={`translate(${widthMap - margin.l - 100}, 10)`}>
        <line x1={0} y1={0} x2={-30} y2={0} stroke="#777" />
        <text dx={5} dy={5}>
          Federated
        </text>
      </g> */}

      {/* <g transform={`translate(${widthMap - margin.l}, 10)`}>
        <circle cx={0} cy={0} r={R} style={{ fill: 'var(--primary-color)' }} />
        <text dx={10} dy={5}>
          Local
        </text>
      </g> */}
      <g transform={`translate(${margin.l}, ${margin.t})`}>
        <g transform={`translate(0, ${heightMap})`} className="axes x-axis" ref={$xaxis} />
        <g className="axes y-axis" ref={$yaxis} />

        <g ref={$lines} className="lines" />

        <line
          x1={0}
          x2={widthMap + 5}
          y1={heightMap}
          y2={heightMap}
          stroke="rgba(0,0,0,0.8)"
          markerEnd="url(#arrow)"
        />
        <line
          x1={0}
          x2={0}
          y1={heightMap / 2 - PADDING}
          y2={-10}
          stroke="rgba(0,0,0,0.8)"
          markerEnd="url(#arrow)"
        />
        <line
          x1={0}
          x2={0}
          y1={heightMap}
          y2={heightMap / 2 + PADDING}
          stroke="rgba(0,0,0,0.8)"
          markerEnd="url(#arrow)"
        />
        <text dy={-22} textAnchor="middle">
          Loss
        </text>
        <text dy={-22} textAnchor="middle" y={heightMap / 2 + 2 * PADDING}>
          Accuracy
        </text>
        <g transform={`translate(${WIDTH - 40},${HEIGHT - 50})`}>
          <text textAnchor="end"> Communication round</text>
        </g>
        <path d={line(data[0] as any) || ''} stroke="#777" fill="none" />
      </g>
    </svg>
  );
};

export default LineChart;
