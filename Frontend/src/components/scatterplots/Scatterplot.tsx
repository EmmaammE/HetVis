import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as d3 from 'd3';
import { ChartProps } from '../../types/chart';
import useWindowSize from '../../utils/useResize';
import { StateType } from '../../types/data';
import { getType } from '../../utils/getType';

function strokeType(type: string) {
  switch (type) {
    case 'dashed':
      return [18, 12];
    case 'dotted':
      return [2, 8];
    case 'dashed-dotted':
      return [18, 10, 1, 8, 1, 10];
    case 'solid':
    default:
      return [0];
  }
}

function pointColor(label: boolean | number) {
  // return label ? 'rgba(84, 122, 167, .7)' : 'rgba(216, 85, 88, .7)';
  return label ? 'rgba(201,201,201, .5)' : 'rgba(149, 98, 53,.7)';
  // return label ? 'rgba(128,128,128,.5)' : 'rgba(149, 98, 53,.7)';
}

interface ScatterplotProps {
  chartConfig: ChartProps;
  points: number[][];
  x: number[];
  y: number[];
  // 哪种点在上面
  onTop: number;
}

const topArr = [
  [false, true],
  [true, false],
];

function Scatterplot({
  chartConfig: { yaxis, xaxis, margin },
  points,
  x,
  y,
  onTop,
}: ScatterplotProps) {
  const $chart: any = useRef(null);
  const $wrapper = useRef<any>(null);

  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const blockIndex: number = useSelector((state: StateType) => state.blockIndex);
  const heteroList = useSelector((state: StateType) => state.service.heteroList.clusterList);

  const strokeSet = useMemo(
    () => (heteroList[blockIndex] ? new Set(heteroList[blockIndex].heteroIndex) : new Set()),
    [blockIndex, heteroList]
  );

  // const heteroLabels = useSelector((state: any) => state.service.heteroLabels);
  const heteroLabels = useSelector((state: StateType) =>
    getType() === 'local' ? state.service.heteroLabels : state.service.samplesHeteroLabels
  );
  const topOrder = topArr[onTop];

  const handleResize = useCallback(() => {
    const { offsetWidth, offsetHeight } = $wrapper.current;
    const size = Math.min(offsetWidth, offsetHeight);
    setWidth(size);
    setHeight(size);
  }, []);

  useWindowSize(handleResize);

  const xScale = d3
    .scaleLinear()
    .range([0, width])
    .domain(x || [])
    .nice();

  const yScale = d3
    .scaleLinear()
    .range([height, 0])
    .domain(y || [])
    .nice();

  const drawPoints = useCallback(
    (sX: any, sY: any, ctx: CanvasRenderingContext2D) => {
      // console.log('drawPoint', pointsMap)
      ctx.save();

      ctx.strokeStyle = 'rgba(0,0,0, 0.5)';

      topOrder.forEach((label) => {
        // 先画一致的点（灰色）再画不一致的
        ctx.fillStyle = pointColor(label);

        points.forEach((point, i) => {
          if (heteroLabels[i] === label) {
            ctx.moveTo(sX(point[0]), sY(point[1]));
            ctx.beginPath();

            ctx.arc(sX(point[0]), sY(point[1]), 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            if (strokeSet.has(i)) {
              ctx.stroke();
            }
          }
        });
      });

      ctx.restore();
    },
    [heteroLabels, points, strokeSet, topOrder]
  );

  const drawLines = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const ticks = Array(10).fill(null);
      const yticks = d3.scaleLinear().range([0, width]).domain([0, 9]);
      ctx.restore();
      ctx.strokeStyle = 'rgba(10,10,10,0.15)';
      ctx.lineWidth = 1;

      ticks.forEach((v, yy) => {
        ctx.beginPath();
        ctx.setLineDash(strokeType('solid'));
        ctx.moveTo(0, yticks(yy)); // X=min,Y=tick
        ctx.lineTo(width, yticks(yy));
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash(strokeType('solid'));
        ctx.moveTo(yticks(yy), 0); // X=min,Y=tick
        ctx.lineTo(yticks(yy), height);
        ctx.stroke();
      });

      ctx.save();
    },
    [width, height]
  );

  const chartctx = $chart.current && $chart.current.getContext('2d');

  useEffect(() => {
    if (chartctx) {
      // clear
      chartctx.clearRect(0, 0, width, height);
      // chartctx.translate(0.5, 0.5);
      // lines
      // drawL ines(chartctx);

      // points
      drawPoints(xScale, yScale, chartctx);
    }
  }, [$chart, chartctx, drawLines, drawPoints, height, width, xScale, yScale]);

  return (
    <div className="scatter-box" ref={$wrapper}>
      <svg width={`${width}px`} height={`${height}px`}>
        <g transform={`translate(${margin.l},${margin.t})`}>
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="none"
            stroke="#000"
            strokeDasharray="2 2"
          />
        </g>
      </svg>
      <canvas width={`${width}px`} height={`${height}px`} ref={$chart} className="linemap" />
    </div>
  );
}

export default Scatterplot;
