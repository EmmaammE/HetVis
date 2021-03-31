import { useEffect } from 'react';

const useWindowSize = (handleResize: any) => {

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]); 

  return null;
}

export default useWindowSize;