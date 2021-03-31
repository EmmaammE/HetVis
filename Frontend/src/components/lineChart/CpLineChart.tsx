/* eslint-disable no-param-reassign */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface CpLineChartProps {
  margin: {
    r: number;
    b: number;
    l: number;
    t: number;
  };
  data: number[][];
  title: string;
  index: number;
  hetData: number[];
  typeIndex: number;
}

const WIDTH = 510;
const HEIGHT = 210;

type Hash = { [key: number]: number };

const step = 20;
// 记录数组中各个值的个数，返回一个object
const count = (d: number[]) => {
  const hash: Hash = {};
  d.forEach((value) => {
    if (hash[value]) {
      hash[value]++;
    } else {
      hash[value] = 1;
    }
  });
  return hash;
};

const getMax = (...arr: number[][]) => {
  let maxValue = Number.MIN_VALUE;
  arr.forEach((inner) => {
    inner.forEach((value) => {
      if (value > maxValue) {
        maxValue = value;
      }
    });
  });

  return maxValue;
};

// const powerOfTen = (d: any)=> d / (10 ** Math.ceil(Math.log(d) / Math.LN10 - 1e-12)) === 1

// 灰色（一致））棕色（不一致）
const lineColor = ['#b5b6b6', '#aa815d'];

const minLogValue = 1e-4;

const getDomain = (a: number, b: number, type: string) => {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return b;
  if (b === undefined) return a;

  return (Math as any)[type](a, b);
};

const CpLineChart = ({
  margin,
  data: rawData,
  title,
  index,
  hetData,
  typeIndex,
}: CpLineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  const [data, setData] = useState<Hash[] | null>(null);
  const [maxValue, setMax] = useState<number>(0);

  const [binsCount, setBinsCount] = useState<any>([null, null]);
  const [hetBinCount, setHetBinCount] = useState<any>(null);

  useEffect(() => {
    if (rawData[0].length > 0 || rawData[1].length > 0) {
      const hashArr = rawData.map((d) => count(d));
      setData(hashArr);
    }
  }, [rawData]);

  const dataKeys = useMemo(
    () =>
      data
        ? data.map((d) =>
            Object.keys(d)
              .map((v) => +v)
              .sort((a, b) => a - b)
          )
        : [[0], [0]],
    [data]
  );

  const xScale = useMemo(
    () =>
      // console.log(data)
      d3
        .scaleLinear()
        .domain([
          getDomain(dataKeys[0][0], dataKeys[1][0], 'min'),
          getDomain(
            dataKeys[0][dataKeys[0].length - 1],
            dataKeys[1][dataKeys[1].length - 1],
            'max'
          ),
        ])
        // .domain([0,255])
        .range([0, widthMap])
        .nice(),
    [dataKeys, widthMap]
  );

  const minValue = [0, minLogValue, 0][index];

  useEffect(() => {
    if (data === null || Object.keys(hetData).length === 0) {
      return;
    }
    const bins = d3
      .bin()
      // .thresholds(step)
      .thresholds(xScale.ticks(step))(Array.from(new Set([...dataKeys[0], ...dataKeys[1]])));

    const countBins: any[] = [{}, {}];
    const hetBin: any = {};

    const hetHash = count(hetData);

    // console.log(hetHash, countBins)

    // 转换为百分比
    const size = hetData.length;

    bins.forEach((bin: any) => {
      const value = (bin.x0 + bin.x1) / 2;
      bin.forEach((v: any) => {
        // console.log('bin', v, bin.x0, bin.x1)
        countBins.forEach((countBin, i) => {
          if (data[i][v]) {
            if (!countBin[value]) {
              countBin[value] = 0;
            }
            countBin[value] += data[i][v];
          }
        });

        if (hetHash[v]) {
          // 如果Bin中含有的值，是不一致的点具有的值
          if (!hetBin[value]) {
            // 如果还未记录次数
            hetBin[value] = 0;
          }
          // 记在value上
          hetBin[value] += hetHash[v];
        }

        // else {
        //   hetBin[value] = 0;
        // }
      });

      countBins.forEach((countBin) => {
        if (countBin[value] === undefined) {
          countBin[value] = minValue * size;
        }
      });

      if (hetBin[value] === undefined) {
        hetBin[value] = minValue * size;
      }
    });

    countBins.forEach((hash) => {
      Object.keys(hash).forEach((key) => {
        hash[+key] /= size;
      });
    });

    Object.keys(hetBin).forEach((key) => {
      hetBin[key] /= size;
    });

    setBinsCount(countBins);
    setHetBinCount(hetBin);
    // console.log( hetBin, countBins);
    // console.log(title, countBins)

    // console.log(hetBin)
  }, [data, dataKeys, hetData, minValue, rawData, xScale]);

  useEffect(() => {
    if (binsCount[0]) {
      setMax(
        getMax(Object.values(binsCount[0]), Object.values(binsCount[1]), Object.values(hetBinCount))
      );
    }
  }, [binsCount, hetBinCount]);

  const yScales = [
    d3.scaleLinear().range([heightMap, 0]).domain([0, maxValue]).nice(),
    d3.scaleLog().range([heightMap, 0]).domain([minLogValue, maxValue]).nice(),
    d3
      .scaleSymlog()
      .domain([0, maxValue])
      .constant(10 ** 0)
      .range([heightMap, 0]),
  ];

  const yScale = yScales[index] ? yScales[index] : yScales[0];

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);
  const $lines = useRef(null);

  const line = useCallback(
    (datum) =>
      d3
        .line()
        .x((d: any) => xScale(d) as number)
        .y((d: any) => yScale(datum[d]))
        .curve(d3.curveMonotoneX),
    [xScale, yScale]
  );

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).ticks(5);
    let yAxis = d3.axisLeft(yScale).ticks(5);

    if (index === 1) {
      yAxis = yAxis.tickValues([1e-4, 1e-3, 1e-2, 1e-1, 1]);
    }
    const d3lines = d3.select($lines.current);

    d3lines.select('g.yline').call(yAxis.tickSize(-widthMap).tickFormat('' as any) as any);

    d3lines.select('g.xline').call(xAxis.tickSize(heightMap).tickFormat('' as any) as any);

    d3.select($xaxis.current).call(xAxis.tickFormat(d3.format('.3s')));

    d3.select($yaxis.current).call(
      yAxis.tickFormat((d) => {
        if (d < 1e-3) {
          return d3.format('.2p')(d);
        }
        return d3.format('.3p')(d);
      })
    );
  }, [xScale, yScale, widthMap, heightMap, index]);

  // console.log(hetBinCount, binsCount)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <clipPath id="cut">
          <rect x={0} y={0} width={WIDTH} height={heightMap} />
        </clipPath>
      </defs>
      <g transform={`translate(${margin.l}, ${margin.t})`}>
        <g transform="translate(0, 8)" className="axes x-axis" ref={$xaxis} />
        <g className="axes y-axis" ref={$yaxis} />

        <g ref={$lines} className="axis-lines">
          <g className="yline" />
          <g className="xline" />
        </g>
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
          y1={heightMap}
          y2={-5}
          stroke="rgba(0,0,0,0.8)"
          markerEnd="url(#arrow)"
        />
        <text dy={-15} textAnchor="middle">
          Percentage
        </text>
        <text transform={`translate(${widthMap - 30},${heightMap + margin.t + margin.b - 15})`}>
          Value
        </text>
        {hetBinCount && (
          <g>
            <path
              d={
                line(hetBinCount)(
                  (Object.keys(hetBinCount) as any).sort((a: any, b: any) => +a - +b)
                ) as string
              }
              stroke="#c04548"
              fill="none"
              clipPath="url(#cut)"
            />
            {Object.keys(hetBinCount).map((key, j) => (
              <circle
                key={`h-${j}`}
                cx={xScale(+key)}
                cy={yScale(hetBinCount[key])}
                r={2}
                stroke="#c04548"
                fill="#fff"
              />
            ))}
          </g>
        )}
        {binsCount.map(
          (datum: any, i: number) =>
            datum &&
            (typeIndex !== 1 || i === 1) && (
              <path
                key={i}
                d={line(datum)((Object.keys(datum) as any).sort((a: any, b: any) => +a - +b)) || ''}
                stroke={lineColor[i]}
                fill="none"
                // clipPath="url(#cut-off)"
                // opacity="0.7"
                clipPath="url(#cut)"
              />
            )
        )}
        {binsCount.map((datum: any, i: number) => (
          <g key={`c-${i}`}>
            {datum !== null &&
              (typeIndex !== 1 || i === 1) &&
              Object.keys(datum).map((key, j) => (
                <circle
                  key={`c-${i}-${j}`}
                  cx={xScale(+key)}
                  cy={yScale(datum[key as any])}
                  r={2}
                  stroke={lineColor[i]}
                  fill="#fff"
                  id={datum[key]}
                  // opacity="0.7"
                />
              ))}
          </g>
        ))}

        {/* <rect 
        x='0'
        y='0'
        width={WIDTH}
        height={HEIGHT}
        clipPath="url(#cut)"
        fill='#000'
      /> */}
      </g>
    </svg>
  );
};

export default CpLineChart;
