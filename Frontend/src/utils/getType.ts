const getType = () => sessionStorage.getItem('type') || 'local'

const setType = (type: string) => {
  sessionStorage.setItem('type', type)
}

const setDatasetInfo = (type: string, dimension: number) => {
  sessionStorage.setItem('dataset', type);
  sessionStorage.setItem('dimension', `${dimension}`);
}

const getDatasetInfo = () => ({
    type: sessionStorage.getItem('dataset'),
    dimension: +(sessionStorage.getItem('dimension')||1)
  })

export {
  getType,
  setType,
  setDatasetInfo,
  getDatasetInfo,
}