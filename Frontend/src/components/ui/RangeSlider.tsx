import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

interface RangeSliderProps {
  range: number[];
  setRange: Function;
  extent: number;
}

const WIDTH = 290;
const HEIGHT = 20;
const MARGIN = {
  bottom: 5,
  top: 5,
  left: 6,
  right: 6,
};

// brush两侧的宽度
const HANDLE_WIDTH = 10;

const RangeSlider = ({ range, setRange, extent }: RangeSliderProps) => {
  const heightMap = HEIGHT - MARGIN.top - MARGIN.bottom;
  const widthMap = WIDTH - MARGIN.left - MARGIN.right;

  const x = d3
    .scaleLinear()
    .domain([0, extent - 1])
    .range([0, widthMap]);

  const $brush = useRef(null);

  const brush = useMemo(
    () =>
      d3
        .brushX()
        .extent([
          [-HANDLE_WIDTH / 2 - 2, -2],
          [widthMap, heightMap + 1],
        ])
        .on('start brush end', ({ selection, sourceEvent, type }) => {
          if (!sourceEvent) return;
          if (selection) {
            const sx = selection.map(x.invert);
            sx[1] = Math.ceil(sx[1]);
            sx[0] = Math.max(Math.floor(sx[0]), 0);

            if (sx[0] !== range[0] || sx[1] !== range[1]) {
              d3.select($brush.current as any).call(brush.move, sx.map(x));
              // console.log(sx)
              setRange(sx);
            }
          }
        }),
    [heightMap, range, setRange, widthMap, x]
  );

  useEffect(() => {
    if ($brush.current) {
      const brushSelect = d3.select($brush.current as any).call(brush);
      brushSelect.call(brush.move, [range[0], range[1]].map(x));
    }
  }, [brush, extent, range, x]);

  return (
    <div className="legend-wrapper tip">
      <p>{range[0] + 1}</p>
      <div>
        <svg width="290px" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <defs>
            <linearGradient id="range" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#efefef" />
              <stop offset="100%" stopColor="#333" />
            </linearGradient>
          </defs>

          <rect
            x={MARGIN.left}
            width={widthMap}
            y={MARGIN.top - 1}
            height={heightMap}
            fill="#fff"
            stroke="#000"
          />

          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            <g ref={$brush} className="range-brush" />
            <rect
              className="my-handle"
              x={x(range[0])}
              y={-MARGIN.top + 1}
              width={HANDLE_WIDTH}
              height={HEIGHT - 2}
              rx={HANDLE_WIDTH / 2}
              ry={HANDLE_WIDTH / 2}
            />
            <rect
              className="my-handle"
              x={x(range[1]) - HANDLE_WIDTH / 2}
              y={-MARGIN.top + 1}
              width={HANDLE_WIDTH}
              height={HEIGHT - 2}
              rx={HANDLE_WIDTH / 2}
              ry={HANDLE_WIDTH / 2}
            />
          </g>
        </svg>
      </div>

      <p>{range[1] + 1}</p>
    </div>
  );
};

export default RangeSlider;
