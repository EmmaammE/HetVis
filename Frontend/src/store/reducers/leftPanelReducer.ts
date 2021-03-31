import { DataType, SET_LEFT_PANEL_DATA } from "../leftpanelAction";

const initState: DataType = {
  time: [],
  federated: {
    "loss": [], 
    "gradient": [],
    "weight": [],
  },
  others: []
}

export default function leftPanelReducer(state = initState, action: any) {
  switch(action.type) {
    case SET_LEFT_PANEL_DATA:
      return {...state, ...action.data}
    default:
      return state;
  }
}