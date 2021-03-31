export const SET_LEFT_PANEL_DATA = 'SET_LEFT_PANEL_DATA';

export interface updatePCAParams {
  "decision": boolean,// 是否终止联邦
  "heteroDecision": boolean[],// 是否忽略
  "space": any,// 对不忽略的异构定义团体
}

export interface DataType {
  "time": number[][],
  "federated": {
    "loss": [], 
    "gradient": number[][],
    "weight": number[][],
  }, 
  "others": Array<{
    "clientName": string,
    "loss": number[], 
    "gradient": number[][],
    "weight": number[][],
  }>
}

export const getData = () => async (dispatch: any) => {
  try {
    fetch('/fl-hetero/initialize/')
      .then(resp => resp.json())
      .then(res => dispatch({
          type: SET_LEFT_PANEL_DATA,
          data: res
        }))
  } catch(err) {
    console.log(err);
  }
}

export const updateData = (args: updatePCAParams) => async (dispatch: any) => {
  try {
    fetch('/fl-hetero/customize', {
      method: 'POST',
      body: JSON.stringify(args)
    }).then(res => res.json())
      .then(res => dispatch({
          type: SET_LEFT_PANEL_DATA,
          data: res
        }))
  } catch(err) {
    console.log(err);
  }
}