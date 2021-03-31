import React from 'react';

interface IconProps {
  status: number;
  id: number;
}

const classes = ['right-join', 'intersection', 'sum'];
const Icon = ({ status, id }: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 1134 1134"
    data-id={id}
    className={`svg-icon ${classes[status]}`}
  >
    <g clipPath="url(#clip0)">
      <path
        id="path-1"
        d="M430.5 567.5C430.5 375.857 585.857 220.5 777.5 220.5 969.143 220.5 1124.5 375.857 1124.5 567.5 1124.5 759.143 969.143 914.5 777.5 914.5 585.857 914.5 430.5 759.143 430.5 567.5Z"
        strokeWidth="2"
        strokeMiterlimit="8"
        fillRule="evenodd"
      />

      <path
        id="path-0"
        d="M7.5 567.5C7.5 375.857 163.081 220.5 355 220.5 546.919 220.5 702.5 375.857 702.5 567.5 702.5 759.143 546.919 914.5 355 914.5 163.081 914.5 7.5 759.143 7.5 567.5Z"
        strokeWidth="2"
        strokeMiterlimit="8"
        fillRule="evenodd"
      />

      <path
        id="path-2"
        d="M567.5 293.5 577.034 300.622C654.27 364.294 703.5 460.654 703.5 568.5 703.5 676.346 654.27 772.706 577.034 836.379L567.5 843.5 557.966 836.378C480.73 772.706 431.5 676.346 431.5 568.5 431.5 460.654 480.73 364.294 557.966 300.621Z"
        strokeWidth="2"
        strokeMiterlimit="8"
        fillRule="evenodd"
      />
    </g>
  </svg>
);

export default Icon;
