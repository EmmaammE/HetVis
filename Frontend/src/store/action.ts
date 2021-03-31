
import {PointsState, PointAction, IPoints} from '../types/point';

export const SET_POINTS = "SET_POINTS";

export function setPoints(points: IPoints) {
  const action: PointAction = {
    type: SET_POINTS,
    points,
  }

  return action;
}
