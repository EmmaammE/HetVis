/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/label-has-associated-control */
import * as d3 from 'd3';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import inputStyles from '../../styles/input.module.css';
import useWindowSize from '../../utils/useResize';
import Gradient from '../ui/Gradient';
import ICON from '../../assets/convex.svg';
import { getType } from '../../utils/getType';
import { StateType } from '../../types/data';
import { getCPCA } from '../../store/reducers/service';
import { setIndexAction } from '../../store/reducers/blockIndex';

interface GridMatrixProps {
  // 一个二维数组，表示点的投影坐标
  data: number[][];
  xLabels: number[];
  yLabels: number[];
  // 高亮的点的下标
  highlight: Set<number>;
  // 不一致点的下标
  heteroIndex: Set<number>;
  heteroLabels: boolean[];
  // 列表的点
  strokeSet: Set<number>;
  strokeStatus: number;
  chosePoint: number;
  setChosePoint: Function;
  setStrokePoints: Function;
  gridPointsIndex: number[];
  // 设置选择格子之后，格子点的坐标
  setBlockIndex: Function;
}

// 点的半径
const R = 3;

// const margin = { t: 50, r: 0, b: 0, l: 60 };
const margin = { t: 0, r: 0, b: 0, l: 0 };
// 格子之间的缝隙
const padding = 10;

const colorScale = d3
  .scaleLinear<string>()
  // .domain([0, 0.5, 1])
  .domain([0, 0.5, 1])
  .range(['#ffdfb2', '#eee', '#cde8ba']);
// 红白蓝
// .range(['#e60d17', '#fff', '#0b69b6']);

const mergeDomain = (
  [minA, maxA]: [number, number] | [undefined, undefined],
  [minB, maxB]: [number, number] | [undefined, undefined]
) => [Math.min(minA || 0, minB || 0), Math.max(maxA || 0, maxB || 0)];

const order = (item: number, arr: number[]) => {
  const v = arr.indexOf(item);
  return v === -1 ? arr.length : v;
};

const GridMatrix = ({
  data,
  xLabels,
  yLabels,
  highlight,
  heteroIndex,
  heteroLabels,
  strokeSet,
  strokeStatus,
  chosePoint,
  setChosePoint,
  setStrokePoints,
  gridPointsIndex,
  setBlockIndex,
}: GridMatrixProps) => {
  const $chart = useRef(null);
  const $wrapper = useRef(null);

  const [svgWidth, setWidth] = useState(425);
  const [svgHeight, setHeight] = useState(425);

  const xLabelsArr = useMemo(() => Array.from(new Set(xLabels)).sort(), [xLabels]);
  const yLabelsArr = useMemo(
    () =>
      Array.from(new Set(yLabels))
        .sort()
        .sort((a, b) => order(a, xLabelsArr) - order(b, xLabelsArr)),
    [yLabels, xLabelsArr]
  );

  const heteroPointsFromStore = useSelector((state: StateType) => state.basic.heteroPoints);
  const labelNames = useSelector((state: StateType) => state.basic.labelNames);
  const blockIndex: number = useSelector((state: StateType) => state.blockIndex);

  const annoPoints = useSelector((state: StateType) => new Set(state.basic.annoPoints));
  // 格子的大小
  const [gridSize, setGridSize] = useState<number>(0.05);
  // true是checked
  const [display, toggelDisplat] = useState<boolean>(true);

  // const [t, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity.translate(0, 0).scale(1));
  const [t, setTransform] = useState<d3.ZoomTransform[]>(
    Array.from({ length: xLabelsArr.length * yLabelsArr.length }, () => d3.zoomIdentity)
  );

  const [clickGrid, setClickGrid] = useState([-1, -1, 0]);
  const [hoverGrid, setHoverGrid] = useState([-1, -1, 0]);

  const dispatch = useDispatch();
  const updateCPCA = useCallback(
    (dataIndex: number[], alpha: number | null) => dispatch(getCPCA(dataIndex, alpha)),
    [dispatch]
  );
  const cpacaAlphaFromStore = useSelector((state: StateType) => state.service.cpca.alpha);
  const updateBlock = useCallback((i) => dispatch(setIndexAction(i)), [dispatch]);

  useEffect(() => {
    setTransform(
      Array.from({ length: xLabelsArr.length * yLabelsArr.length }, () => d3.zoomIdentity)
    );
  }, [xLabelsArr.length, yLabelsArr.length]);

  useEffect(() => {
    if (blockIndex !== -1) {
      setClickGrid([-1, -1, 0]);
      setBlockIndex([]);
    }
  }, [blockIndex, setBlockIndex]);

  const $svg = useRef(null);

  const handleResize = useCallback(() => {
    const { offsetWidth, offsetHeight } = ($wrapper as any).current;
    const size = Math.min(offsetWidth - 5, offsetHeight);
    if (xLabelsArr.length === 0) {
      setWidth(size);
      setHeight(size);
    } else {
      const wGrid = (offsetWidth - padding * (xLabelsArr.length - 1)) / xLabelsArr.length;
      const hGrid = (offsetHeight - padding * (xLabelsArr.length - 1)) / xLabelsArr.length;
      const grid = Math.min(wGrid, hGrid);

      const w = grid * xLabelsArr.length + padding * (xLabelsArr.length - 1);
      const h = grid * yLabelsArr.length + padding * (yLabelsArr.length - 1);

      setWidth(w);
      setHeight(h);
    }
  }, [xLabelsArr.length, yLabelsArr.length]);

  useWindowSize(handleResize);

  const indexXScale = d3
    .scaleLinear()
    .range([0, svgWidth - margin.l - margin.r - padding * (xLabelsArr.length - 1)])
    .domain([0, 2 * xLabelsArr.length]);

  // console.log(indexXScale.domain(), indexXScale(1))
  const indexYScale = d3
    .scaleLinear()
    .range([0, svgHeight - margin.t - margin.b - padding * (yLabelsArr.length - 1)])
    .domain([0, 2 * yLabelsArr.length]);

  const width = useMemo(() => indexXScale(2) - indexXScale(0) - 2, [indexXScale]);
  const height = useMemo(() => indexYScale(2) - indexYScale(0) - 2, [indexYScale]);

  // console.log('size', width, height)
  // 格子的size映射为坐标上相差多少
  const normScale = d3.scaleLinear().range([0, width]).domain([0, 1]);

  const xDomain: any = useMemo(
    () =>
      heteroPointsFromStore.length === 0
        ? d3.extent(data, (d) => d[0])
        : mergeDomain(
            d3.extent(data, (d) => d[0]),
            d3.extent(heteroPointsFromStore, (d) => d[0]) as any
          ),
    [data, heteroPointsFromStore]
  );

  const yDomain: any = useMemo(
    () =>
      heteroPointsFromStore.length === 0
        ? d3.extent(data, (d) => d[1])
        : mergeDomain(
            d3.extent(data, (d) => d[1]),
            d3.extent(heteroPointsFromStore, (d) => d[1]) as any
          ),
    [heteroPointsFromStore, data]
  );

  const xScale = useMemo(() => d3.scaleLinear().range([0, width]).domain(xDomain).nice(), [
    width,
    xDomain,
  ]);

  const yScale = useMemo(() => d3.scaleLinear().range([0, height]).domain(yDomain).nice(), [
    height,
    yDomain,
  ]);

  const points: number[][] = useMemo(
    () =>
      data.map((point, k) => {
        const pointX = xLabels[k];
        const pointY = yLabels[k];
        return [xScale(point[0]) || 0, yScale(point[1]) || 0, pointX, pointY, k];
      }),
    [data, xLabels, yLabels, xScale, yScale]
  );

  const type = getType();

  const quadtree = d3
    .quadtree<any>()
    .extent([
      [-1, -1],
      [svgWidth + 1, svgHeight + 1],
    ])
    .x((d) => d[0])
    .y((d) => d[1])
    .addAll(points);

  const search = useCallback(
    (x0, y0, x3, y3) => {
      const validData: any = [];
      quadtree.visit((node, x1, y1, x2, y2) => {
        const pData = (node as any).data;

        if (pData) {
          const p = pData;
          p.selected = p[0] >= x0 && p[0] < x3 && p[1] >= y0 && p[1] < y3;
          if (p.selected) {
            validData.push(pData);
          }
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
      });
      return validData;
    },
    [quadtree]
  );

  const clusterPoints = useMemo(() => {
    const grids = d3.range(0, 1.00001, gridSize).map((d) => normScale(d));
    const arr: any = [];

    xLabelsArr.forEach((xlabel) => {
      const arrByColumn = [];
      for (let i = 0; i < grids.length - 1; i++) {
        const x0 = grids[i];
        const x1 = grids[i + 1];

        const row: any = [];

        for (let j = 0; j < grids.length - 1; j++) {
          const y0 = grids[j];
          const y1 = grids[j + 1];
          const searched = search(x0, y0, x1, y1);
          // const positive = searched.filter((d:any)=> d[2] === d[3]);
          // ground truth label占的比例
          const positive = searched.filter((d: any) => xlabel === d[2]);

          // console.log(positive)
          row.push({
            x0,
            x1,
            y0,
            y1,
            ratio: searched.length ? positive.length / searched.length : -1,
          });
        }

        arrByColumn.push(row);
      }

      arr.push(arrByColumn);
    });

    // console.log(arr);
    return arr;
  }, [gridSize, normScale, search, xLabelsArr]);

  const heteroPoints: [number, number][] = useMemo(() => {
    if (clickGrid[2] !== 0)
      return gridPointsIndex.map((index) => [points[index][0], points[index][1]]);
    if (type === 'local') {
      return points.filter((d, k) => heteroIndex.has(k)).map((point) => [point[0], point[1]]);
    }
    return heteroPointsFromStore.map((point) => [xScale(point[0]), yScale(point[1])]);
  }, [
    clickGrid,
    gridPointsIndex,
    heteroIndex,
    heteroPointsFromStore,
    points,
    type,
    xScale,
    yScale,
  ]);

  // console.log(heteroPoints)
  const hull = useMemo(() => d3.polygonHull(heteroPoints), [heteroPoints]);

  useEffect(() => {
    const zoomerFactory = () =>
      d3
        .zoom()
        .scaleExtent([1, 15])
        .extent([
          [0, 0],
          [svgWidth, svgHeight],
        ])
        .duration(300)
        .on('zoom', (event) => {
          const {
            transform: { x, y, k },
          } = event;

          if (k === 1) {
            setTransform(t.map(() => d3.zoomIdentity));
          } else {
            setTransform(t.map(() => d3.zoomIdentity.translate(x, y).scale(k)));
          }
        });

    d3.select($svg.current)
      // .call(zoomerFactory() as any);
      .selectAll('.cluster')
      .each(function callZoom() {
        d3.select(this).call(zoomerFactory() as any);
      });
    // .on('dblclick.zoom', () => {
    //   const transform = d3.zoomIdentity.translate(0, 0).scale(1);
    //   d3.select($svg.current)
    //     .transition()
    //     .duration(200)
    //     .ease(d3.easeLinear)
    //     .call((zoomer as any).transform, transform);
    // });
  }, [$svg, height, svgHeight, svgWidth, t, width, xScale, yScale]);
  // console.log(xScale.domain(), xScale.range())

  // x, y, 是否一致，是否描边，id, 是否在闭包
  const gridPoints = useMemo(
    () =>
      xLabelsArr.map((xLabel, i) =>
        yLabelsArr.map((yLabel, j) => {
          const pointsArr0: number[][] = [];
          const pointsArr1: number[][] = [];

          // 如果点击了格子
          const gridFlag = clickGrid[0] === i && clickGrid[1] === j;

          points.forEach((point, k) => {
            // 绘制点
            // const pointX = point[2];
            // const pointY = point[3];
            const pointX = xLabels[k];
            const pointY = yLabels[k];

            if (pointX === xLabel && pointY === yLabel) {
              let isStroke = 0;
              let isInHull = false;

              if (type === 'local') {
                isInHull = heteroIndex.has(k);
              } else {
                isInHull = hull !== null && d3.polygonContains(hull, point as any);
              }

              if (clickGrid[2] !== 0) {
                if (heteroLabels[k] === false && gridFlag) {
                  isStroke = 1;
                }
              } else if (annoPoints.size === 0) {
                // 如果，没有高亮的标记点，计算当前选择的点和异构块中的点的关系
                switch (strokeStatus) {
                  case 0:
                    if (isInHull) {
                      isStroke = 1;
                    }
                    break;
                  case 1:
                    // 求交集
                    if (isInHull && strokeSet.has(k)) {
                      isStroke = 1;
                    }
                    break;
                  case 2:
                    // 求并集
                    if (isInHull || strokeSet.has(k)) {
                      isStroke = 1;
                    }
                    break;
                  default:
                    break;
                }
              } else if (annoPoints.has(k)) {
                isStroke = 1;
              }

              if (heteroLabels[k] === false) {
                // 不一致
                pointsArr1.push([point[0], point[1], 1, isStroke, k, Number(isInHull)]);
              } else {
                pointsArr0.push([point[0], point[1], 0, isStroke, k, Number(isInHull)]);
              }
            }
            // pointsArr0.push([posX, posY, heteroLabels[k] === false ? 1:0, 0, k]);
          });

          return pointsArr0.concat(pointsArr1).sort((a, b) => a[3] - b[3]);
        })
      ),
    [
      annoPoints,
      clickGrid,
      heteroIndex,
      heteroLabels,
      hull,
      points,
      strokeSet,
      strokeStatus,
      type,
      xLabels,
      xLabelsArr,
      yLabels,
      yLabelsArr,
    ]
  );

  const clickHandle = useCallback(
    (i: number, j: number) => {
      // console.log('clickHandle')
      setClickGrid([i, j, 1]);

      const pointsId = gridPoints[i][j].filter((point) => point[2] === 1).map((point) => point[4]);
      updateCPCA(pointsId, cpacaAlphaFromStore);
      setBlockIndex(pointsId);
      updateBlock(-1);
      // setStrokePoints(gridPoints[i][j]);
    },
    [cpacaAlphaFromStore, gridPoints, setBlockIndex, updateBlock, updateCPCA]
  );

  const pointsCount = useMemo(
    () =>
      gridPoints.map((gridPointsColumn) =>
        gridPointsColumn.map((gridPoint) => {
          let convexCount = 0;
          let blockCount = 0;
          gridPoint.forEach((point) => {
            if (point[5] === 1 && point[2] === 1) {
              convexCount++;
            }
            if (point[2] === 1) {
              blockCount++;
            }
          });

          return {
            convexCount,
            blockCount,
          };
        })
      ),
    [gridPoints]
  );

  useEffect(() => {
    if (annoPoints.size === 0) {
      // 如果stroke的是注释的点，不更新
      const arr: any = [];
      gridPoints.forEach((gridPointsRow) => {
        gridPointsRow.forEach((pointArr) => {
          pointArr.forEach((point) => {
            // console.log(point)
            if (point[3]) {
              arr.push(point[4]);
            }
          });
        });
      });

      setStrokePoints(arr);
    }
  }, [annoPoints, gridPoints, setStrokePoints]);

  const $hideChart = useRef(null);

  useEffect(() => {
    if (!$chart.current || !xScale || !yScale) {
      return;
    }

    const ctx = ($chart.current as any).getContext('2d');
    const hiddenCtx = ($hideChart.current as any).getContext('2d');

    ctx.clearRect(0, 0, svgWidth, svgHeight);
    hiddenCtx.clearRect(0, 0, svgWidth, svgHeight);
    ctx.lineWidth = 1;

    ctx.strokeStyle = 'rgba(0,0,0, 0.5)';

    // console.log(pointsInHullArr);
    gridPoints.forEach((gridPointRow, i) => {
      // 每一行
      gridPointRow.forEach((gridPoint, j) => {
        const left = margin.l + indexXScale(i * 2) + padding * i;
        const top = margin.t + indexYScale(j * 2) + padding * j;
        // ctx.restore();

        // ctx.rect(left, top,  width, height);
        // ctx.fill()
        // ctx.clip();

        // 每一格，point的序号已经变了，必须使用point数组中的k
        const tmpT = t[i * yLabelsArr.length + j] || d3.zoomIdentity;

        gridPoint.forEach((point) => {
          let alpha = 0.7;

          if (highlight.has(point[4])) {
            alpha = 1;
          }
          if (point[2] === 0) {
            // 0 一致
            ctx.fillStyle = `rgba(200,200,200,${alpha - 0.1})`;
          } else {
            ctx.fillStyle = `rgba(149, 98, 53,${alpha})`;
            // ctx.fillStyle = `rgba(197,92,0,${alpha})`;
          }

          const [posX, posY] = tmpT.apply([point[0], point[1]] as any);
          const x = posX + left;
          const y = posY + top;

          if (
            tmpT.k === 1 ||
            (x >= left + R && x <= left + width - R && y >= top + R && y <= top + width - R)
          ) {
            // ctx.moveTo(point[0], point[1]);
            ctx.moveTo(x, y);
            ctx.beginPath();

            ctx.arc(x, y, point[4] === chosePoint ? R + 2 : R, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            if (point[3]) {
              ctx.stroke();
            }

            hiddenCtx.moveTo(x, y);
            let color = point[4];
            const b = color % 256;
            const g = parseInt(`${(color /= 256)}`, 10) % 256;
            const r = parseInt(`${(color /= 256)}`, 10) % 256;
            hiddenCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;

            // console.log(r,g,b);
            // hiddenCtx.fillStyle = colorString;
            hiddenCtx.beginPath();
            hiddenCtx.arc(x, y, R, 0, Math.PI * 2);
            hiddenCtx.closePath();
            hiddenCtx.fill();
          }
        });
      });
    });
  }, [
    $chart,
    data,
    gridPoints,
    height,
    highlight,
    indexXScale,
    indexYScale,
    svgHeight,
    svgWidth,
    width,
    xLabels,
    xLabelsArr,
    xScale,
    yLabels,
    yLabelsArr,
    yScale,
    chosePoint,
    t,
  ]);

  const handleGridSizeChange = (e: any) => {
    setGridSize(e.target.value);
  };

  const handleDisplay = () => {
    toggelDisplat(!display);
  };
  // console.log(pointsInHull, hullArr)

  const clickPoint = (e: any) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const hiddenCtx = ($hideChart.current as any).getContext('2d');
    const [r, g, b] = hiddenCtx.getImageData(offsetX, offsetY, 1, 1).data;
    const value = r * 256 * 256 + g * 256 + b;
    setChosePoint(value);
  };

  return (
    <div className="grid-container">
      <div className="row">
        <div className="col">
          <div className="input-wrapper">
            <p className="label">Grid size: </p>
            <div className={inputStyles.wrapper}>
              <input
                className={inputStyles.input}
                type="number"
                min="0.0"
                max="1.0"
                step="0.01"
                value={gridSize}
                onChange={handleGridSizeChange}
              />
            </div>
          </div>

          <div className="input-wrapper">
            <span> Ground-truth labels: </span>
            <Gradient
              colors={['#ffdfb2', '#eee', '#cde8ba']}
              legends={['0%', '100%']}
              width="50px"
              height={25}
              ratio={['0%', '50%', '100%']}
            />
          </div>
        </div>
        <div className="col">
          <div className="tgl-wrapper">
            <input
              className="tgl"
              id="cb4"
              type="checkbox"
              checked={display}
              onChange={handleDisplay}
            />
            <label className="tgl-btn" htmlFor="cb4" />
            <span>Display scatters</span>
          </div>

          <div className="convex-legend">
            <img src={ICON} alt="convex" />
            <span>Convex hull of the selected cluster</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <p className="yLabel-title">Output (federated learning model) </p>

        <div className="xLabels">
          <div className="title">
            <span>Ground-truth label</span>
          </div>
          <div className="xLabels-arr">
            {xLabelsArr.map((text) => (
              <span key={text}>{labelNames[text]}</span>
            ))}
          </div>
        </div>

        <div className="chart-wrapper" ref={$wrapper}>
          <div className="yLabels" style={{ height: `${svgHeight}px` }}>
            {yLabelsArr.map((text, j) => (
              <span key={j}>{labelNames[text]}</span>
            ))}
          </div>
          <div className="svg-wrapper">
            <svg
              viewBox={`-1 -1  ${svgWidth + 2} ${svgHeight}`}
              width={`${svgWidth + 2}px`}
              height={`${svgHeight}px`}
              cursor="pointer"
              ref={$svg}
            >
              <defs>
                <clipPath id="rect">
                  <rect x={0} y={0} width={width} height={height} />
                </clipPath>
              </defs>
              <g transform={`translate(${margin.l},${margin.t})`}>
                {width > 0 &&
                  xLabelsArr.map((x, i) =>
                    yLabelsArr.map((y, j) => {
                      const left = margin.l + indexXScale(i * 2) + padding * i;
                      const top = margin.t + indexYScale(j * 2) + padding * j;

                      return (
                        <g
                          key={`${i}-${j}`}
                          id={`${i}-${j}`}
                          transform={`translate(${left}, ${top})`}
                          clipPath="url(#rect)"
                          className="cluster"
                        >
                          <g
                            transform={
                              t[i * yLabelsArr.length + j] &&
                              t[i * yLabelsArr.length + j].toString()
                            }
                            onClick={clickPoint}
                          >
                            {clusterPoints[i].map((cluster: any, rectX: number) => (
                              <g key={`${i}-${j}-${rectX}`} id={`${i}-${rectX}`}>
                                {cluster.map((rect: any, rectY: number) => {
                                  const { x0, x1, y0, y1, ratio } = rect;
                                  return (
                                    <rect
                                      data-pos={`${i}-${j}-${rectX}-${rectY}`}
                                      key={`${x0},${y0},${i}`}
                                      fill={ratio === -1 ? '#fff' : colorScale(ratio)}
                                      x={x0}
                                      y={y0}
                                      width={x1 - x0}
                                      height={y1 - y0}
                                    />
                                  );
                                })}
                              </g>
                            ))}
                          </g>

                          <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            fill="none"
                            stroke="#777"
                            strokeDasharray="2 2"
                            strokeWidth="1px"
                          />

                          <path
                            d={`M0,0 L${width},0 L${width},${height} L0,${height} L0,0Z`}
                            fill="none"
                            stroke="#333"
                            opacity={
                              i === hoverGrid[0] && j === hoverGrid[1]
                                ? 0.5
                                : i === clickGrid[0] && j === clickGrid[1]
                                ? 1
                                : 0
                            }
                            strokeWidth="4px"
                            className="outline"
                            onClick={() => clickHandle(i, j)}
                            onMouseMove={() => {
                              setHoverGrid([i, j, 0.5]);
                            }}
                            onMouseOut={() => {
                              setHoverGrid([-1, -1, 0]);
                            }}
                          />
                        </g>
                      );
                    })
                  )}
              </g>
            </svg>

            <canvas
              ref={$chart}
              width={`${svgWidth}px`}
              height={`${svgHeight}px`}
              style={{
                opacity: display ? 1 : 0,
                pointerEvents: 'none',
              }}
            />

            <canvas
              ref={$hideChart}
              width={`${svgWidth}px`}
              height={`${svgHeight}px`}
              style={{
                // display: 'none',
                opacity: 0,
                pointerEvents: 'none',
              }}
            />

            <svg
              viewBox={`-1 -1  ${svgWidth + 2} ${svgHeight}`}
              width={`${svgWidth + 2}px`}
              height={`${svgHeight}px`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
              }}
            >
              <g transform={`translate(${margin.l},${margin.t})`}>
                {width > 0 &&
                  xLabelsArr.map((x, i) =>
                    yLabelsArr.map((y, j) => {
                      const left = margin.l + indexXScale(i * 2) + padding * i;
                      const top = margin.t + indexYScale(j * 2) + padding * j;
                      const { convexCount, blockCount } = pointsCount[i][j];
                      // const hull = hullArr[i][j];
                      return (
                        <g
                          key={`${i}-${j}`}
                          id={`${i}-${j}`}
                          clipPath="url(#rect)"
                          transform={`translate(${left}, ${top})`}
                        >
                          {hull !== null && (
                            <path
                              d={`M${hull.join(' L')} Z`}
                              fill="none"
                              strokeWidth={
                                2 /
                                (t[i * yLabelsArr.length + j] ? t[i * yLabelsArr.length + j].k : 1)
                              }
                              stroke="var(--primary-color)"
                              transform={
                                t[i * yLabelsArr.length + j] &&
                                t[i * yLabelsArr.length + j].toString()
                              }
                            />
                          )}
                          <text x="4" y="14" fontSize="14">
                            {convexCount} / {blockCount}
                          </text>
                        </g>
                      );
                    })
                  )}
              </g>
            </svg>
          </div>
        </div>

        {/* end of chart-container */}
      </div>
    </div>
  );
};

// export default React.memo(GridMatrix);
export default GridMatrix;
