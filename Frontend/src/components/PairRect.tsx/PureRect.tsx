import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useWindowSize from '../../utils/useResize';
import { getDatasetInfo } from '../../utils/getType';

interface PureRectProps {
  data: number[];
}

const rectWidth = 20;
const rectHeight = 20;

// const rowCount = 28;

const PureRect = ({ data }: PureRectProps) => {
  const { type, dimension } = getDatasetInfo();

  // const columnCount = data.length / rowCount;
  const rowCount = Math.sqrt(dimension);

  const columnCount = Math.ceil(dimension / rowCount);
  const WIDTH = rectWidth * columnCount;
  const HEIGHT = rectHeight * rowCount;

  const $svg = useRef(null);
  const $chart = useRef(null);

  const [bound, setBound] = useState<any>({ width: 0, height: 0 });

  const xScale = d3.scaleLinear().domain([0, WIDTH]).range([0, bound.width]);
  const yScale = d3.scaleLinear().domain([0, HEIGHT]).range([0, bound.height]);

  const rectHeightMap = yScale(rectHeight);
  const rectWidthMap = xScale(rectWidth);

  const handleResize = useCallback(() => {
    const { offsetWidth, offsetHeight } = ($svg as any).current;
    const size = Math.min(offsetHeight - 10, offsetWidth);
    setBound({
      width: size,
      height: size,
    });
  }, []);

  useWindowSize(handleResize);

  useEffect(() => {
    if (!$chart.current) {
      return;
    }

    const ctx = ($chart.current as any).getContext('2d');

    ctx.clearRect(0, 0, bound.width, bound.height);

    if (type === 'image') {
      if (data.length > dimension) {
        // 多通道
        for (let i = 0; i < dimension; i++) {
          const r = data[i];
          const g = data[i + dimension];
          const b = data[i + dimension * 2];

          const x = i % columnCount;
          const y = parseInt(`${i / columnCount}`, 10);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(rectWidthMap * x, rectHeightMap * y, rectWidthMap, rectHeightMap);
        }
      } else {
        // 单通道
        data.forEach((d, j) => {
          const x = j % columnCount;
          const y = parseInt(`${j / columnCount}`, 10);
          ctx.fillStyle = `rgb(${d}, ${d}, ${d})`;
          ctx.fillRect(rectWidthMap * x, rectHeightMap * y, rectWidthMap, rectHeightMap);
        });
      }
    }
  }, [
    HEIGHT,
    WIDTH,
    bound.height,
    bound.width,
    columnCount,
    data,
    xScale,
    yScale,
    rectWidthMap,
    rectHeightMap,
    type,
    dimension,
  ]);

  return (
    <div ref={$svg} className="data-wrapper">
      <canvas
        className="pair-canvas"
        ref={$chart}
        width={`${bound.width}px`}
        height={`${bound.height}px`}
        style={
          {
            // border: '1px dashed #777',
            // width: '175px',
            // height: '175px',
            // marginRight: '10px'
          }
        }
      />
    </div>
  );
};

export default PureRect;
