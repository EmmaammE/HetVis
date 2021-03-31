/* eslint-disable no-unused-vars */
export type IPoints = {
  // // 第几个数据源, 第几个点
  // oIndex: number,
  // iIndex: Map<number, boolean>
  [key: number]: Map<number, boolean>
}

export interface PointsState {
  points: IPoints
}

export type PointAction = {
  type: string,
  points: IPoints
}

export type PointsDispatchType = (args: PointAction) => PointAction;