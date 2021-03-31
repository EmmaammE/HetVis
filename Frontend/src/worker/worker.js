/* eslint-disable import/prefer-default-export */

import http from '../utils/http';

let allRes = null;
let blockRes = null;

export async function handle(type, id) {
  if (type === 'all') {
    allRes = http('/fl-hetero/cpca/all/', {
      alpha: null,
    });
  } else if (type === 'block') {
    blockRes = http('/fl-hetero/cpca/cluster/', {
      alpha: null,
      dataIndex: id,
    });
  }
}

export async function getStatus(type) {
  if (type === 'all') {
    return allRes;
  }
  if (type === 'block') {
    return blockRes;
  }
  return Promise.resolve();
}
