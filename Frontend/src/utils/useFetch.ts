import React, { useEffect, useState } from 'react';
import http from './http';

const useFetch = (url: string, param: any) => {
  const [data, setData] = useState<number[]>([]);
  const [request, setRequest] = useState<any>(param);

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      if(request === null) {
        return;
      }

      const res = await http(url, request);
      
      if(!ignore) {
        setData(res.data);
      }
    }

    fetchData();

    return () => {
      ignore = true;
    }
  }, [param, request, url])

  return {
    data,
    setRequest
  }
}

export default useFetch;
