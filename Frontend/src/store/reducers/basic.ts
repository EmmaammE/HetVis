const SET_LISTS = 'SET_LISTS';
const INIT_BASIC = 'INIT_BASIC';

const SET_DATA = 'SET_DATA';

export const setRoundAction = (index: number) => ({
  type: SET_DATA,
  data: {
    round: index
  }
})

export const setPropertyAction = (index: number) => ({
  type: SET_DATA,
  data: {
    propertyIndex: index
  }
})

export const setNameAction = (name: string) => ({
  type: SET_DATA,
  data: {
    clientName: name
  }
})

export const setPosAction = (x: number, y: number) => ({
  type: SET_DATA,
  data: {
    pos: [x, y]
  }
})

export const setSizeAction = (size: number) => ({
  type: SET_DATA,
  data: {
    size,
  }
})

export const setLabelNamesAction = (names: string[]) => ({
  type: SET_DATA,
  data: {
    labelNames: names
  }
})

export const fetchLists = () => (dispatch: any) => {
  fetch('/fl-hetero/annotationList/')
    .then((res) => res.json())
    .then((res) => {
      // console.log(res);
      const { annotationList } = res;

     dispatch({
       type: SET_LISTS,
       data: annotationList
     })
    });
}

export const initBasicData = () => ({
  type: INIT_BASIC
})

// 分块后，计算了cpca的点的坐标
export const setHeteroPointsAction = (points: number[][]) => ({
  type: SET_DATA,
  data: {
    heteroPoints: points
  }
})

// 在mouseout mouseover标记时更新
export const setAnnoPointsAction = (points: number[]) => ({
  type: SET_DATA,
  data: {
    annoPoints: points
  }
})

export const setDataSize = (testSize: number, trainSize: number) => ({
  type: SET_DATA,
  data: {
    dataSize: {
      testSize,
      trainSize,
    }
  }
})
export interface BasicData {
  // 当前分析的round(数组下标)
  round: number,
  // 当前选择的属性
  propertyIndex: number,
  // 客户端名字
  clientName: string,
  // 选择属性的坐标，作为维度名
  pos: number[],
  // 选择的分块.cluster的size
  size: number,
  // 注释列表
  annoLists: any[],
  // 异构点的坐标(如果是采样点，需要额外记录异构点)
  heteroPoints: number[][],
  // 标记的点在原始数据中的序号
  annoPoints: number[],
  // label对应的实际名字
  labelNames: string[],
  dataSize: {
    testSize: number,
    trainSize: number,
  }
}

const initState: BasicData = {
  round: 0,
  propertyIndex: -1,
  clientName: '',
  pos: [0,0],
  // 选中的cluster的size
  size: 0,
  annoLists: [],
  heteroPoints: [],
  annoPoints: [],
  labelNames: [],
  dataSize: {
    testSize: 0,
    trainSize: 0
  }
}

const basicReducer = (state = initState, action: any ) => {
  switch(action.type) {
    case SET_DATA:
      return {...state, ...action.data}
    case SET_LISTS:
      return {...state, annoLists: action.data}
    case INIT_BASIC:
      return {...initState}
    default:
      return state;
  }
}

export default basicReducer;