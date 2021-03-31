const http = async (url: string, param: Object) => {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(param),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  // console.log(res)

  const resp = await res.json();

  return resp;
}

export default http;