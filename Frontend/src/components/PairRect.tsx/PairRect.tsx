import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PairRect.scss';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../../types/data';
import { setPosAction, setPropertyAction } from '../../store/reducers/basic';
import useWindowSize from '../../utils/useResize';
import { getDatasetInfo } from '../../utils/getType';

export interface PairRectProps {
  data: number[];
  title: string;
  color: d3.ScaleLinear<string, number>;
  channel: number;
}

interface RectData {
  x: number;
  y: number;
  width: number;
  height: number;
}

// function getPixelRatio(context: any) {
//   const dpr = window.devicePixelRatio || 1;
//   const bsr =
//     context.webkitBackingStorePixelRatio ||
//     context.mozBackingStorePixelRatio ||
//     context.msBackingStorePixelRatio ||
//     context.oBackingStorePixelRatio ||
//     context.backingStorePixelRatio ||
//     1;

//   return dpr / bsr;
// }

const rectWidth = 20;
const rectHeight = 20;

const PairRect = ({ data, title, color, channel }: PairRectProps) => {
  const { dimension } = getDatasetInfo();

  // const columnCount = data.length / rowCount;
  const rowCount = Math.sqrt(dimension);

  const columnCount = Math.ceil(dimension / rowCount);
  const WIDTH = rectWidth * columnCount;
  const HEIGHT = rectHeight * rowCount;

  const $svg = useRef(null);
  const $chart = useRef(null);
  const $rect = useRef(null);

  const [bound, setBound] = useState<any>({ width: 0, height: 0 });
  const dispatch = useDispatch();

  const propertyIndex = useSelector((state: StateType) => state.basic.propertyIndex);
  const pos = useSelector((state: StateType) => state.basic.pos);

  const xScale = d3.scaleLinear().domain([0, WIDTH]).range([0, bound.width]);

  const yScale = d3.scaleLinear().domain([0, HEIGHT]).range([0, bound.height]);

  const rectHeightMap = yScale(rectHeight);
  const rectWidthMap = xScale(rectWidth);

  const chosePro = useMemo(
    () => ({
      x: rectWidthMap * (propertyIndex % columnCount),
      y: rectHeightMap * parseInt(`${propertyIndex / rowCount}`, 10),
      width: rectWidthMap,
      height: rectHeightMap,
      id: `${propertyIndex % columnCount},${parseInt(`${propertyIndex / rowCount}`, 10)}`,
    }),
    [columnCount, propertyIndex, rectHeightMap, rectWidthMap, rowCount]
  );

  const [hoverPro, setHoverPro] = useState<RectData | null>(null);

  const updatePropertyIndex = useCallback((i) => dispatch(setPropertyAction(i)), [dispatch]);
  const updatePos = useCallback((x: number, y: number) => dispatch(setPosAction(x, y)), [dispatch]);

  useEffect(() => {
    const { id } = chosePro;

    const posArr = id.split(',').map((d) => +d);
    if (pos[0] !== posArr[0] || pos[1] !== posArr[1]) {
      updatePos(posArr[0], posArr[1]);
    }
  }, [chosePro, columnCount, pos, rectHeightMap, rectWidthMap, updatePos]);

  const handleResize = useCallback(() => {
    const { offsetWidth, offsetHeight } = ($svg as any).current;
    // NOTE 10px的空隙
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

    data.slice(dimension * channel, dimension * (channel + 1)).forEach((d, j) => {
      const x = j % columnCount;
      const y = parseInt(`${j / columnCount}`, 10);

      // ctx.fillStyle=color(dataScale(d));
      ctx.fillStyle = color(d);
      ctx.fillRect(rectWidthMap * x, rectHeightMap * y, rectWidthMap, rectHeightMap);
    });
  }, [
    HEIGHT,
    WIDTH,
    bound.height,
    bound.width,
    columnCount,
    data,
    propertyIndex,
    xScale,
    yScale,
    rectWidthMap,
    rectHeightMap,
    color,
    dimension,
    channel,
  ]);

  useEffect(() => {
    d3.select($rect.current)
      .on('click', (event) => {
        const { offsetX, offsetY } = event;
        const indexY = parseInt(`${offsetY / rectHeightMap}`, 10);
        const indexX = parseInt(`${offsetX / rectWidthMap}`, 10);
        const index = indexY * rowCount + indexX;
        updatePropertyIndex(index);
        updatePos(indexX, indexY);
        setHoverPro(null);
      })
      .on('mousemove', (event) => {
        const { offsetX, offsetY } = event;
        const indexY = parseInt(`${offsetY / rectHeightMap}`, 10);
        const indexX = parseInt(`${offsetX / rectWidthMap}`, 10);
        setHoverPro({
          x: indexX * rectWidthMap,
          y: indexY * rectHeightMap,
          width: rectWidthMap,
          height: rectHeightMap,
        });
      })
      .on('mouseout', () => {
        setHoverPro(null);
      });
  }, [columnCount, rectHeightMap, rectWidthMap, rowCount, updatePos, updatePropertyIndex, yScale]);

  return (
    <div className="wrapper">
      <div>
        <p className="rotate">{title}</p>
      </div>
      <div className="chart-wrapper" ref={$svg}>
        <canvas
          className="pair-canvas"
          ref={$chart}
          width={`${bound.width}px`}
          height={`${bound.height}px`}
        />

        <svg width={`${bound.width}px`} height={`${bound.height}px`} className="overlay">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            ref={$rect}
            cursor="pointer"
            fill="transparent"
          />
          <rect {...chosePro} stroke="#000" fill="#fff" fillOpacity="0" />

          {hoverPro && (
            <rect {...hoverPro} stroke="#777" fill="#fff" fillOpacity="0" pointerEvents="none" />
          )}
        </svg>
      </div>
    </div>
  );
};

export default PairRect;
