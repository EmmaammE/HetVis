export const SET_BLOCK_INDEX = 'SET_BLOCK_INDEX';

export const setIndexAction = (index: number) => ({
    type: SET_BLOCK_INDEX,
    data: index
  })

const blockIndexReducer = (state = 0, action: any) => {
  switch(action.type) {
    case SET_BLOCK_INDEX:
      return action.data;
    default:
      return state;
  }
}

export default blockIndexReducer;