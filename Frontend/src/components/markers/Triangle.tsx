import React from 'react';

function Triangle() {
  return (
    <>
      <marker
        id="arrow"
        refX="6 "
        refY="6"
        viewBox="0 0 16 16"
        markerWidth="10"
        markerHeight="10"
        markerUnits="userSpaceOnUse"
        orient="auto"
      >
        <path d="M 0 0 12 6 0 12 3 6 Z" />
      </marker>
      <marker
        id="arrow-end"
        refX="6 "
        refY="6"
        viewBox="0 0 16 16"
        markerWidth="10"
        markerHeight="10"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 12 6 0 12 3 6 Z" />
      </marker>
    </>
  );
}

export default Triangle;
