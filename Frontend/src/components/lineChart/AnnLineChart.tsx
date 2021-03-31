/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDispatch, useSelector } from 'react-redux';
import { useModal } from 'react-modal-hook';
import Triangle from '../markers/Triangle';
import { setRoundAction, setAnnoPointsAction } from '../../store/reducers/basic';
import { StateType } from '../../types/data';
import chat from '../../assets/chat.svg';
import { setLevelAction } from '../../store/reducers/service';
import HTTP_LEVEL from '../../utils/level';
import ConfirmDialog from '../ui/ConfirmDialog';

export interface LineChartProps {
  margin: {
    r: number;
    b: number;
    l: number;
    t: number;
  };
  data: { [key: string]: number[] };
  list: { [key: string]: any };
  datumKey: string;
  deleteAnn: Function;
}

const WIDTH = 1920;
const HEIGHT = 200;

const xTicks = 20;
const yTicks = 5;

const DRAG_PADDING = 20;

const AnnoLineChart = ({ margin, data: rawData, list, datumKey, deleteAnn }: LineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightActual: number = HEIGHT - margin.t - margin.b;

  const data = useMemo(() => (rawData && rawData[datumKey]) || [], [datumKey, rawData]);

  const yDomain: number[] = useMemo(() => {
    if (data.length > 0) {
      return (d3.extent(data) as any).map((d: any, i: number) =>
        i === 0 ? Math.floor(d * 10) / 10 : Math.ceil(d * 10) / 10
      );
    }
    return [0, 0];
  }, [data]);

  const yScaleActual = d3.scaleLinear().range([0, heightActual]).domain([0, yDomain[1]]);

  const axisBreakspace = useMemo(
    () => (yDomain[0] < yScaleActual.invert(20) || yDomain[0] === 0 ? 0 : 20),
    [yDomain, yScaleActual]
  );

  const heightMap: number = HEIGHT - margin.t - margin.b - axisBreakspace;

  const yScale = useMemo(
    () =>
      yDomain[0] < yScaleActual.invert(20)
        ? d3.scaleLinear().range([heightMap, 0]).domain([0, yDomain[1]])
        : d3.scaleLinear().range([heightMap, 0]).domain(yDomain),
    [heightMap, yDomain, yScaleActual]
  );

  const round = useSelector((state: StateType) => state.basic.round);
  const dispatch = useDispatch();
  const setRound = useCallback((i) => dispatch(setRoundAction(i)), [dispatch]);

  const $lines = useRef(null);

  const xScale = d3.scaleLinear().range([0, widthMap]).domain([0, data.length]);
  const [pos, setPos] = useState<number>(0);
  const setLevel = useCallback((level: number) => dispatch(setLevelAction(level)), [dispatch]);
  const [tipPos, setTipPos] = useState<number[]>([0, 0]);
  const [tipId, setTipid] = useState<number>(-1);

  const setAnnoPoints = useCallback((param) => dispatch(setAnnoPointsAction(param)), [dispatch]);
  const [deleteAnnItem, setDeleteAnnItem] = useState<any>(null);

  const deleteAnnHandler = (id: number) => {
    deleteAnn(id);
  };

  const [showConfirmModal, hideConfirmModal] = useModal(
    ({ in: open }) => (
      <ConfirmDialog
        open={open}
        title="Delete annotation?"
        confirmLabel="DELETE"
        onConfirm={() => deleteAnnHandler(deleteAnnItem)}
        onCancel={hideConfirmModal}
      >
        Do you really want to delete the annotation {chatPos[deleteAnnItem].text} ?
      </ConfirmDialog>
    ),
    [deleteAnnItem]
  );

  const $drag: any = useRef(null);

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const line = d3
    .line()
    // .curve(d3.curveMonotoneX)
    .x((d, i) => xScale(i + 1))
    .y((d: any) => yScale(d));

  useEffect(() => {
    setPos(widthMap);
  }, [rawData, widthMap]);

  const zigzag = useMemo(() => {
    if (axisBreakspace) {
      const numZags = 5;
      const zagDist = (axisBreakspace - 3) / numZags;

      let curZig = heightMap;
      let d = `M0,${curZig}`;
      for (let i = 0; i < numZags; i++) {
        curZig += zagDist;
        d += i % 2 === 0 ? `L3,${curZig}` : `L-3,${curZig}`;
      }

      d += `L0,${heightMap + axisBreakspace}`;

      return d;
    }
    return null;
  }, [axisBreakspace, heightMap]);

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).ticks(xTicks);
    const yAxis = d3.axisLeft(yScale).ticks(yTicks);

    d3.select($xaxis.current).transition().call(xAxis.scale(xScale));

    d3.select($yaxis.current).transition().call(yAxis.scale(yScale));

    const d3lines = d3.select($lines.current);

    d3lines.select('g.yline').call(
      d3
        .axisLeft(yScale)
        .ticks(yTicks)
        .tickSize(-widthMap)
        .tickFormat('' as any) as any
    );
    d3lines.select('g.xline').call(
      d3
        .axisBottom(xScale)
        .ticks(xTicks)
        .tickSize(heightMap + axisBreakspace)
        .tickFormat('' as any) as any
    );
  }, [data, widthMap, xScale, yScale, $lines, heightMap, axisBreakspace]);

  const drag = useMemo(
    () =>
      d3
        .drag()
        .on('drag', ({ x }) => {
          setPos(x);
        })
        .on('end', ({ x }) => {
          const d = xScale.invert(x);
          const fixedValue = Math.min(data.length, Math.max(1, Math.round(d)));
          if (round !== fixedValue - 1) {
            setRound(fixedValue - 1);
            setLevel(HTTP_LEVEL.labels);
          }

          const posX = xScale(fixedValue);
          if (posX !== pos) {
            setPos(posX);
          }
        }),
    [data.length, pos, round, setLevel, setRound, xScale]
  );

  useEffect(() => {
    if (data.length === 0) {
      return;
    }
    const dragSelection = d3.select($drag.current);
    dragSelection.call(drag);
  }, [data.length, drag, round, xScale]);

  const chatPos = useMemo(() => {
    const arr: any = [];

    if (list) {
      Object.keys(list).forEach((r) => {
        const x = xScale(+r + 1);
        const indexScale = d3
          .scaleLinear()
          .range([heightMap - 35, 20])
          .domain([0, list[r].length]);

        list[r].forEach((anno: any, j: number) => {
          arr.push({
            text: anno.text,
            x,
            y: indexScale(j),
            r: anno.round,
            dataIndex: anno.dataIndex,
            id: j,
          });
        });
      });
    }

    return arr;
  }, [heightMap, list, xScale]);

  const handleMouseover = (e: any) => {
    const id = +e.target.id;

    const { x, y } = chatPos[id];
    if (x > WIDTH - 120) {
      setTipPos([x - 150, y - 50]);
    } else {
      setTipPos([x + 10, y - 50]);
    }

    setTipid(id);
    setAnnoPoints(chatPos[id].dataIndex);
  };

  const handleMouseout = () => {
    setTipid(-1);
    setAnnoPoints([]);
    setTipPos([-400, 400]);
  };

  const onDeleteAnn = (e: any, id: number) => {
    e.preventDefault();
    setDeleteAnnItem(id);
    showConfirmModal();
  };

  return (
    <>
      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <Triangle />
        </defs>
        <g transform={`translate(${margin.l}, ${margin.t})`}>
          <g
            transform={`translate(0, ${heightMap + axisBreakspace})`}
            className="axes x-axis"
            ref={$xaxis}
          />
          <g className="axes y-axis" ref={$yaxis} />

          <g ref={$lines} className="lines">
            <g className="yline" />
            <g className="xline" />
          </g>

          {zigzag && <path d={zigzag} stroke="#333" fill="none" />}

          <line
            x1={0}
            x2={widthMap + 5}
            y1={heightMap + axisBreakspace}
            y2={heightMap + axisBreakspace}
            stroke="rgba(0,0,0,0.8)"
            markerEnd="url(#arrow)"
          />
          <line
            x1={0}
            x2={0}
            y1={heightMap}
            y2={-10}
            stroke="rgba(0,0,0,0.8)"
            markerEnd="url(#arrow)"
          />
          <path d={line(data as any) || ''} stroke="#777" fill="none" />
          <g onClick={handleMouseover}>
            {chatPos.map((chatItem: any, i: number) => (
              <image
                xlinkHref={chat}
                key={i}
                id={`${i}`}
                x={chatItem.x}
                y={chatItem.y}
                height="25"
                width="25"
                data-tip="hhh"
                data-for="annTip"
                cursor="pointer"
                style={{
                  opacity: tipId === i ? 0 : 1,
                }}
                onContextMenu={(event) => onDeleteAnn(event, chatItem.id)}
              />
            ))}
          </g>
          <g
            ref={$drag}
            transform={`translate(${pos}, ${DRAG_PADDING})`}
            cursor="move"
            fill="var(--primary-color)"
          >
            <rect
              transform={`translate(-10, ${-DRAG_PADDING - 10})`}
              x="0"
              y="0"
              width="20"
              height="20"
              fill="#fff"
              fillOpacity="0.5"
            />
            <text textAnchor="middle" y={-DRAG_PADDING + 8} fill="#000">
              {Math.round(xScale.invert(pos))}
            </text>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={heightMap - DRAG_PADDING + axisBreakspace}
              strokeWidth="3"
              stroke="var(--primary-color)"
            />
            <path d="M0 8 L-15 -8 L15 -8Z" />
          </g>
        </g>
      </svg>

      <div
        className="tooltip"
        style={{
          left: tipPos[0],
          top: tipPos[1],
          opacity: tipId === -1 ? 0 : 1,
        }}
        onMouseDown={handleMouseout}
      >
        <svg viewBox="0 0 300 120" width="300px" height="120px" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M74.3,46.3H23.4c-1.4,0-9.1,2.7-9.1,2.7s3.8-7.3,3.8-8.6v-26c0-5.3,4.6-9.6,10.3-9.6h45.9
              c5.7,0,10.3,4.3,10.3,9.6v22.2C84.5,42,79.9,46.3,74.3,46.3z"
            fill="#F7F8F8"
            stroke="#000"
            strokeWidth="0.5"
            transform="scale(2.3)"
          />
          <foreignObject x="50" y="18" width="135" height="82">
            {tipId !== -1 && (
              <div className="tip-text">
                <p>Size: {chatPos[tipId].dataIndex.length}</p>

                <div className="scroll-panel">
                  <p>{chatPos[tipId].text}</p>
                </div>
              </div>
            )}
          </foreignObject>
        </svg>
      </div>
    </>
  );
};

export default AnnoLineChart;
