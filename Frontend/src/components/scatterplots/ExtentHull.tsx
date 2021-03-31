import React, { useMemo } from 'react';
import styles from '../../styles/axis.module.css';

interface HullProps {
  extent: [[number, number], [number, number]];
}

function Hull({ extent }: HullProps) {
  const rectProp = useMemo(
    () => ({
      x: extent[0][0],
      y: extent[1][1],
      width: extent[0][1] - extent[0][0],
      height: extent[1][0] - extent[1][1],
    }),
    [extent]
  );

  return <rect className={styles.overlay} {...rectProp} />;
}

export default Hull;
