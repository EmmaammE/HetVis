import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProps } from '../../types/chart';
import Triangle from '../markers/Triangle';

interface LineProps {
  chartConfig: ChartProps;
}

function Lineplot({ chartConfig: { width, height, yaxis, xaxis, margin } }: LineProps) {
  const widthMap: number = width - margin.l - margin.r;
  const heightMap: number = height - margin.t - margin.b;

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);
  const $brush: any = useRef(null);

  const xScale = d3.scaleLinear().range([0, widthMap]).domain([0, 10]).nice();

  const yScale = d3.scaleLinear().range([heightMap, 0]).domain([0, 100]).nice();

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).ticks(9);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    d3.select($xaxis.current)
      .call(xAxis.scale(xScale))
      .call((g) => g.select('.domain').remove())
      // .call(g => g.select('.domain').append('line').style('marker-end', "url(#hTriangle)"))
      .call((g) =>
        g.selectAll('.tick line').attr('stroke-opacity', 0.5).attr('stroke-dasharray', '0,25')
      );

    d3.select($yaxis.current)
      .call(yAxis.scale(yScale))
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g.selectAll('.tick line').attr('stroke-opacity', 0.5).attr('stroke-dasharray', '0,25')
      );
  }, [xScale, yScale]);

  // function brushend(){
  //   if (!(d3 as any).event.sourceEvent) return; // Only transition after input.
  //   if (!(d3 as any).event.selection) return; // Ignore empty selections.
  //   const d0 = (d3 as any).event.selection.map(xScale.invert);
  //       const d1 = d0.map(d3.timeDay.round);

  //   // If empty when rounded, use floor & ceil instead.
  //   if (d1[0] >= d1[1]) {
  //     d1[0] = d3.timeDay.floor(d0[0]);
  //     d1[1] = d3.timeDay.offset(d1[0]);
  //   }

  //   d3.select(this).transition().call(d3.event.target.move, d1.map(x));
  // }

  const brushend = useCallback(
    ({ selection }) => {
      const d = selection.map(xScale.invert);
      const value = (d[0] + d[1]) / 2;

      console.log(value);
    },
    [xScale]
  );

  // reference: https://bl.ocks.org/EfratVil/5edc17dd98ece6aabc9744384e46f45b
  const brush = useMemo(
    () =>
      d3
        .brushX()
        .extent([
          [0, 0],
          [widthMap, heightMap - 2],
        ])
        .on('end', brushend),
    [brushend, heightMap, widthMap]
  );

  useEffect(() => {
    const brushSelection = d3.select($brush.current);

    brushSelection.call(brush).call(brush.move, [xScale(4.95), xScale(5.05)]);

    brushSelection.selectAll('.handle').remove();
    brushSelection.select('.overlay').remove();
  }, [$brush, brush, xScale]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%' }}>
      <defs>
        <Triangle />
      </defs>
      <g transform={`translate(${margin.l},${margin.t})`}>
        <g transform={`translate(0, ${heightMap})`} className="axes x-axis" ref={$xaxis} />
        <g className="axes y-axis" ref={$yaxis} />
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
          y2={-10}
          stroke="rgba(0,0,0,0.8)"
          markerEnd="url(#arrow)"
        />
        <g ref={$brush} className="brush" />
      </g>
    </svg>
  );
}

export default Lineplot;
