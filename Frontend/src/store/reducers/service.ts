import { getType } from "../../utils/getType";
import http from "../../utils/http";
import HTTP_LEVEL from "../../utils/level";
import Worker from '../../worker';

const SET_CHOOSE_POINT = 'SET_CHOSE_POINT';
const INIT_OR_UPDATE = 'INIT_OR_UPDATE_TYPE';
const INIT_IDENTITY = 'INIT_IDENTITY';
const SET_LEVEL = 'SET_LEVEL';
const SET_LOADING = 'SET_LOADING';
const SET_PCA = 'SET_PCA';

export const defaultCount = 8;
export const defaultAlpha = 10;
export const defaultAllAlpha = 10;

export const instance = new Worker();

export interface IdentifyData {
  // 原始数据在分块cpca投影下的坐标
  "localData": number[][],
  // 采样数据/原始数据 在all cpca投影下的坐标
  "samples":  number[][],
  // 真实标签
  "groundTruth": number[],
  // 模型输出标签
  "outputLabels": number[],
  // 异构标签（0：一致，1：不一致）
  // true: 一致
  "heteroLabels": [],
  // 采样点的异构标签
  "samplesHeteroLabels": [],
  "localOutputLabel": [],
  "heteroList": {
    clusterList: Array<{
      "heteroSize": number,// 不一致数据所占空间大小/最细粒度采样节点数
      "heteroIndex": number[], // 分块内不一致数据点的下标
      "heteroRate": number, // 不一致点在块中所占的比例
    }>,
    nrOfClusters: number
  },
  // 所有点的cpca
  "allCPCA": {
    "cpc1": [],
    "cpc2": [],
    'alpha': number
  },
  // 分块的cpca
  "cpca": {
    "tensor": [[], []]
    "alpha": number
  },
  "loading": boolean,
  "level": number,
  "chosePoint": number,
  "gradImages": number[][][]
}

const initState: any= {
   "localData": [],
   "samples": [],
   "groundTruth": [],
   "outputLabels": [],
   "heteroLabels": [],
   "samplesHeteroLabels": [],
   "localOutputLabel": [],
   "heteroList": {
     clusterList: [],
     nrOfClusters: defaultCount
   },
   // 所有点的cpca
   "allCPCA": {
     "cpc1": [],
     "cpc2": [],
     'alpha': defaultAllAlpha
   },
   // 分块的cpca
   "cpca": {
    "tensor": [[], []],
     "alpha": defaultAlpha
   },
   "loading": false,
   "level": 0,
   "chosePoint": -1,
   "gradImages": [[], []]
};

export const initIdentityAction = () => ({
  type: INIT_IDENTITY
})

export const setLevelAction = (level: number) => ({
  type: SET_LEVEL,
  data: level
})

export const setChosePointAction = (index: number) => ({
  type: SET_CHOOSE_POINT,
  data: index
})

export const loading = (v: boolean) => ({
  type: SET_LOADING,
  data: v
})

export const getAllCPCA = (alpha: number|null) => async (dispatch: any) => {
  try {
    const res = await http('/fl-hetero/cpca/all/', {alpha});
    dispatch({
      type: SET_PCA,
      data: res
    })
  } catch(err) {
    console.log(err);
  }
}

const SET_HETELIST = 'SET_HETELIST';

export const getHeteList = (count: number|null) => async (dispatch: any) => {
  try {
    const res = await http('/fl-hetero/cluster/'
      , count ? {
        "nrOfClusters": count,
      }: {})

    dispatch({
      type: SET_HETELIST,
      data: res
    })
  } catch(err) {
    console.log(err);
  }
}

export const getGradImages = (dataIndex: number[]) => async (dispatch: any) => {
  try {
    await dispatch(loading(true));

    const {fed, local} = await http('/fl-hetero/grad_images/'
      , {
        "dataIndex": dataIndex,
      })

    dispatch({
      type: INIT_OR_UPDATE,
      data: {
        gradImages: [
          fed.thermos,
          local.thermos
        ],
        loading: false
      }
    })
  } catch(err) {
    console.log(err);
  }
}

export const getCPCA = (dataIndex: number[], alpha: number|null) => async (dispatch: any) => {
  try {
    await dispatch(loading(true));
    
    // const {alpha: cpcaAlpha, cPC1, cPC2, projectedData: localData} = alpha === null 
    // ? await instance.getStatus('block') 
    // : await http('/fl-hetero/cpca/cluster/', {
    //   "dataIndex":dataIndex,
    //   "alpha": alpha || defaultAlpha
    // })
    const {alpha: cpcaAlpha, cPC1, cPC2, projectedData: localData} = alpha === null 
    ? await http('/fl-hetero/cpca/cluster/', {
      "dataIndex":dataIndex,
      "alpha": null
    }) 
    : await http('/fl-hetero/cpca/cluster/', {
      "dataIndex":dataIndex,
      "alpha": alpha || defaultAlpha
    })

    dispatch({
      type: INIT_OR_UPDATE,
      data: {
        localData,
        cpca: {
          "tensor": [
            cPC1,
            cPC2,
          ],
          "alpha": cpcaAlpha
        },
        loading: false
      }
    })
  } catch(err) {
    console.log(err);
  }
}

const identifyReducer = (state = initState, action: any) => {
  switch(action.type) {
    case INIT_OR_UPDATE:
      return {
        ...state,
        ...action.data
      }
    case SET_LOADING:
      return {...state, loading: action.data}
    case INIT_IDENTITY:
      return {...initState, level: HTTP_LEVEL.client+1};
    case SET_LEVEL:
      return {...state, level: action.data};
    case SET_CHOOSE_POINT:
      return {...state, chosePoint: action.data};
    case SET_PCA: 
      return {...state,
        pca: action.data
      }
   
    case SET_HETELIST:
      return {...state, 
        heteroList: action.data
      }
    default:
      return state;
  }
}

export default identifyReducer;

export const onTypeUpdateOrInitAction = (type: string, round: number, alpha: number|null, count: number|null, clusterId:number|null, cpcaAlphaP: number|null) => async (dispatch: any) => {
  await dispatch(loading(true));
  
  try {
    const res1 = await http('/fl-hetero/sampling/', {
      samplingType: type,
    });
  
    const {groundTruthLabel, outputLabel, consistencyLabel, localOutputLabel}= await http('/fl-hetero/labels/',  {
      "round": round,
    })
  
    const {alpha: resAlpha,  projectedData} = await http('/fl-hetero/cpca/all/', {
      alpha: alpha || defaultAllAlpha
    })
  
    // instance.handle('all', undefined);
  
    const res4 = await http('/fl-hetero/cluster/', {
      "nrOfClusters": count || defaultCount
    })
  
    const dataIndexP = res4.clusterList[clusterId||0].heteroIndex;
    const {alpha: cpcaAlpha, cPC1, cPC2, projectedData: localData} = await http('/fl-hetero/cpca/cluster/', {
      "dataIndex": dataIndexP,
      "alpha": cpcaAlphaP || defaultAlpha
    })
  
    // instance.handle('block', dataIndexP);
  
    // truth: labelNames[groundTruth[chosePoint]],
    // output: labelNames[outputLabels[chosePoint]],
    // client: labelNames[localLabels[chosePoint]],
    // 联邦
    // const correctServerOutput = outputLabel.filter((label: any, i: number) => label === groundTruthLabel[i]).length;
    // // local
    // const correctLocalOutput = localOutputLabel.filter((label: any, i: number) => label === groundTruthLabel[i]).length;
  
    // console.log(correctServerOutput, correctLocalOutput, groundTruthLabel.length);
  
    if(type === 'local') {
      dispatch({
        type: INIT_OR_UPDATE,
        data: {
          localData,
          samples: projectedData,
          groundTruth: groundTruthLabel,
          outputLabels: outputLabel,
          heteroLabels: consistencyLabel,
          localOutputLabel,
          heteroList: res4,
          allCPCA: {
            cpc1: [],
            cpc2: [],
            alpha: resAlpha,
          },
          cpca: {
            "tensor": [
              cPC1,
              cPC2,
            ],
            "alpha": cpcaAlpha
          },
          level: HTTP_LEVEL.cpca,
          loading: false
        }
      })
    } else {
      dispatch({
        type: INIT_OR_UPDATE,
        data: {
          localData,
          samples: projectedData,
          samplesHeteroLabels: consistencyLabel,
          heteroList: res4,
          allCPCA: {
            cpc1: [],
            cpc2: [],
            alpha: resAlpha,
          },
          cpca: {
            "tensor": [
              cPC1,
              cPC2,
            ],
            "alpha": cpcaAlpha
          },
          level: HTTP_LEVEL.cpca,
          loading: false
        }
      })
    }
  } catch(err) {
    console.log(err);
    dispatch({
      type: INIT_OR_UPDATE,
      data: {
        loading: false
      }
    })
  }
}

export const onRoundAction = (round: number, alpha: number|null, count: number|null, clusterId: number|null, cpcaAlphaP: number|null) => async (dispatch: any) => {
  await dispatch(loading(true));

  try {
    const res2 = await http('/fl-hetero/labels/',  {
      "round": round,
    })
  
    const {alpha: resAlpha,  projectedData} = await http('/fl-hetero/cpca/all/', {
      alpha: alpha || defaultAllAlpha
    })
  
    const res4 = await http('/fl-hetero/cluster/', {
      "nrOfClusters": count || defaultCount
    })
  
    const dataIndexP = res4.clusterList[clusterId || 0].heteroIndex;
    const {alpha: cpcaAlpha, cPC1, cPC2, projectedData: localData} = await http('/fl-hetero/cpca/cluster/', {
      "dataIndex": dataIndexP,
      "alpha": cpcaAlphaP || defaultAlpha
    })
  
    if(getType() === 'local') {
      dispatch({
        type: INIT_OR_UPDATE,
        data: {
          localData,
          samples: projectedData,
          groundTruth: res2.groundTruthLabel,
          outputLabels: res2.outputLabel,
          heteroLabels: res2.consistencyLabel,
          localOutputLabel: res2.localOutputLabel,
          heteroList: res4,
          allCPCA: {
            cpc1: [],
            cpc2: [],
            alpha: resAlpha,
          },
          cpca: {
            "tensor": [
              cPC1,
              cPC2,
            ],
            "alpha": cpcaAlpha
          },
          level: HTTP_LEVEL.cpca,
          loading: false
        }
      })
    } else {
      dispatch({
        type: INIT_OR_UPDATE,
        data: {
          localData,
          samples: projectedData,
          samplesHeteroLabels: res2.consistencyLabel,
          heteroList: res4,
          allCPCA: {
            cpc1: [],
            cpc2: [],
            alpha: resAlpha,
          },
          cpca: {
            "tensor": [
              cPC1,
              cPC2,
            ],
            "alpha": cpcaAlpha
          },
          level: HTTP_LEVEL.cpca,
          loading: false
        }
      })
    }
  } catch(err) {
    console.log(err);
    dispatch({
      type: INIT_OR_UPDATE,
      data: {
        loading: false
      }
    })
  }
}


export const onAllAlphaAction = ( alpha: number|null, count: number|null, clusterId: number|null, cpcaAlphaP: number|null) => async (dispatch: any) => {
  await dispatch(loading(true));

  // const {alpha: resAlpha, projectedData} = alpha === null
  //   ? await instance.getStatus('all')
  //   : await http('/fl-hetero/cpca/all/', {
  //     alpha
  //   })
  const {alpha: resAlpha, projectedData} = await http('/fl-hetero/cpca/all/', { alpha })

  const res4 = await http('/fl-hetero/cluster/', {
    "nrOfClusters": count || defaultCount
  })

  const dataIndexP = res4.clusterList[clusterId || 0].heteroIndex;

  const {alpha: cpcaAlpha, cPC1, cPC2, projectedData: localData} = await http('/fl-hetero/cpca/cluster/', {
      "dataIndex": dataIndexP,
      "alpha": cpcaAlphaP || defaultAlpha
    })

  // instance.handle('block', dataIndexP);

  dispatch({
    type: INIT_OR_UPDATE,
    data: {
      localData,
      samples: projectedData,
      heteroList: res4,
      allCPCA: {
        cpc1: [],
        cpc2: [],
        alpha: resAlpha,
      },
      cpca: {
        "tensor": [
          cPC1,
          cPC2,
        ],
        "alpha": cpcaAlpha
      },
      level: HTTP_LEVEL.cpca,
      loading: false
    }
  })
}

export const onListAction = (count: number|null, clusterId: number|null, cpcaAlphaP: number|null) => async (dispatch: any) => {
  await dispatch(loading(true));
  
  try {
    const res4 = await http('/fl-hetero/cluster/', {
      "nrOfClusters": count
    })

    const dataIndexP = res4.clusterList[clusterId||0].heteroIndex;
  
    const {alpha: cpcaAlpha, cPC1, cPC2, projectedData: localData} = await http('/fl-hetero/cpca/cluster/', {
        "dataIndex": dataIndexP,
        "alpha": cpcaAlphaP || defaultAlpha
      })

    // instance.handle('block', dataIndexP);

    dispatch({
      type: INIT_OR_UPDATE,
      data: {
        heteroList: res4,
        localData,
        cpca: {
          "tensor": [
            cPC1,
            cPC2,
          ],
          "alpha": cpcaAlpha
        },
        level: HTTP_LEVEL.cpca,
        loading: false
      }
    })
  } catch(err) {
    console.error(err);
    dispatch({
      type: INIT_OR_UPDATE,
      data: {
        loading: false
      }
    })
  }
}
