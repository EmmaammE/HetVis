import { bindActionCreators } from 'redux';
import {PointsState, PointAction} from '../types/point';
import {SET_POINTS} from './action'

const initialState = {
  points: {}
}

const reducer = (
  state: PointsState = initialState,
  action: PointAction
): PointsState => {
  switch (action.type) {
    case SET_POINTS: {
      // console.log(action.points)
      const pointsT = {...state.points, ...action.points};
      return { ...state, ...{ points: pointsT}}
    }
    default:
      return state
  }
}

export default reducer