import { ChartProps } from "./chart";
// import { DataItem } from "./data";

export default interface ScatterplotProps {
  chartConfig: ChartProps,
  // data: DataItem[],
  oIndex: number,
  // extents: Array<[
  //     // x轴的范围
  //     [number, number],
  //     // y轴的范围
  //     [number, number],
  //   ]
  // >,
  // 0：svg  1: canvas
  render: number,
  pos?: [number, number]
  [key: string]: any,
}
