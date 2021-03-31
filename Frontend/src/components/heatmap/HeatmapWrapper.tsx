import React, { useCallback, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useDispatch, useSelector } from 'react-redux';
import Heatmap from './Heatmap';
import { StateType } from '../../types/data';
import { getCPCA, setChosePointAction } from '../../store/reducers/service';
import { setSizeAction, setHeteroPointsAction } from '../../store/reducers/basic';
import { setIndexAction } from '../../store/reducers/blockIndex';
import { getType } from '../../utils/getType';

export const WIDTH = 60;
export const HEIGHT = 60;

export const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

const areEqual = (first: number[][], second: number[][]) => {
  if (first.length !== second.length) {
    return false;
  }

  if (first.length === 0 || second.length === 0) {
    return false;
  }
  for (let i = 0; i < first.length; i++) {
    if (first[i].join('') !== second[i].join('')) {
      return false;
    }
  }
  return true;
};
interface HeatmapWrapperProps {
  points: number[][];
  // x范围
  x: number[];
  // y范围
  y: number[];
  nOfCluster: number | null;
}

const HeatmapWrapper = ({ points, x, y, nOfCluster }: HeatmapWrapperProps) => {
  const heteroList = useSelector((state: StateType) => state.service.heteroList.clusterList);

  const width = WIDTH - MARGIN.left - MARGIN.right;
  const height = HEIGHT - MARGIN.bottom - MARGIN.right;

  const xScale = d3.scaleLinear().domain(x).range([0, width]).nice();
  const yScale = d3.scaleLinear().domain(y).range([height, 0]).nice();

  const dispatch = useDispatch();

  const blockIndex = useSelector((state: StateType) => state.blockIndex);
  const setClusterSize = useCallback((s) => dispatch(setSizeAction(s)), [dispatch]);
  const updateBlock = useCallback((i) => dispatch(setIndexAction(i)), [dispatch]);

  const cpacaAlphaFromStore = useSelector((state: StateType) => state.service.cpca.alpha);
  const serverLabels = useSelector((state: StateType) => state.service.outputLabels);
  const groudTruth = useSelector((state: StateType) => state.service.groundTruth);
  const heteroPoints = useSelector((state: StateType) => state.basic.heteroPoints);
  const annoPoints = useSelector((state: StateType) => new Set(state.basic.annoPoints));

  const setHeteroPoints = useCallback(
    (pointsParam) => dispatch(setHeteroPointsAction(pointsParam)),
    [dispatch]
  );
  const setChosePoint = useCallback((i) => dispatch(setChosePointAction(i)), [dispatch]);

  const updateCPCA = useCallback(
    (dataIndex: number[], alpha: number | null) => dispatch(getCPCA(dataIndex, alpha)),
    [dispatch]
  );

  const densityData = useMemo(
    () =>
      d3
        .contourDensity()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .size([width, height])
        .bandwidth(4)
        .thresholds(800)(points as any),
    [xScale, width, height, points, yScale]
  );

  const linear = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(densityData, (d) => d.value)] as [number, number])
        .range([0, 1]),
    [densityData]
  );

  const heteroPointsArr = useMemo(
    () =>
      // console.log(heteroList)
      heteroList.map((heteroItem) =>
        heteroItem.heteroIndex.map((index) => {
          const point = points[index];
          if (point) {
            return [xScale(point[0]), yScale(point[1])];
          }
          return [0, 0];
        })
      ),
    [heteroList, points, xScale, yScale]
  );

  const fedHeteroPointsAcc = useMemo(
    () =>
      getType() === 'local'
        ? heteroList.map(({ heteroIndex }) => {
            const correct = heteroIndex.filter((d) => serverLabels[d] === groudTruth[d]);

            // console.log(correct.length)
            return correct.length / heteroIndex.length;
          })
        : [],
    [groudTruth, heteroList, serverLabels]
  );

  const intersectionWithAnnpoints = useMemo(
    () =>
      getType() === 'local'
        ? heteroList.map(({ heteroIndex }) => heteroIndex.filter((d) => annoPoints.has(d)))
        : [],
    [annoPoints, heteroList]
  );

  useEffect(() => {
    if (heteroList[blockIndex] && heteroList[blockIndex].heteroIndex) {
      const d = heteroList[blockIndex].heteroIndex.map((index) => points[index] || []);
      // console.log(d)
      if (areEqual(heteroPoints, d) === false) {
        // console.log('set hetero')
        setClusterSize(heteroList[blockIndex].heteroSize);
        setHeteroPoints(d);
        setChosePoint(heteroList[blockIndex].heteroIndex[0]);
      }
    }
  }, [
    blockIndex,
    heteroList,
    heteroPoints,
    points,
    setChosePoint,
    setClusterSize,
    setHeteroPoints,
  ]);

  // console.log(heteroPointsArr)
  const n = nOfCluster !== null && nOfCluster < 4 ? Math.max(2, nOfCluster) : 4;
  const ifMultiLine = nOfCluster !== null && nOfCluster > 4;

  const updateBlockHandle = useCallback(
    (i: number) => {
      updateBlock(i);
      updateCPCA(heteroList[i].heteroIndex, cpacaAlphaFromStore);
      // instance.handle('block', heteroList[i].heteroIndex);
    },
    [cpacaAlphaFromStore, heteroList, updateBlock, updateCPCA]
  );

  return (
    <div className="pair-rect-wrapper">
      <div
        className="scroll-glyphs"
        style={{
          gridTemplateColumns: `repeat(${n}, ${`${((ifMultiLine ? 100 : 103) - n * 3) / n}%`})`,
          paddingRight: ifMultiLine ? '0' : '8px',
          overflow: nOfCluster !== null && nOfCluster > 8 ? 'auto' : 'visible',
        }}
      >
        {heteroList.slice(0, 100).map((heteroItem, i) => {
          const size = intersectionWithAnnpoints[i] ? intersectionWithAnnpoints[i].length : 0;
          return (
            <div
              className="pair-rect"
              key={i}
              role="menuitem"
              tabIndex={0}
              onClick={() => updateBlockHandle(i)}
              onKeyDown={() => updateBlockHandle(i)}
            >
              <div
                className={[blockIndex === i ? 'selected' : '', size > 0 ? 'hovered' : ''].join(
                  ' '
                )}
              >
                <Heatmap
                  densityData={densityData}
                  linear={linear}
                  heteroPoints={heteroPointsArr[i]}
                />
              </div>
              <p style={{ marginTop: '-2px' }}>
                Size: {heteroItem.heteroSize}
                <span>{size > 0 ? ` (${size})` : ''}</span>
              </p>
              <p>
                {fedHeteroPointsAcc[i] !== undefined
                  ? `Accuracy: ${d3.format('.2p')(fedHeteroPointsAcc[i])}`
                  : '    '}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeatmapWrapper;
