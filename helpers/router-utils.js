import axios from 'axios';

import {
  isNonEmptyStr,
  isNum,
  isNumOrStr,
  isStr,
  isArray,
  isFunc,
} from './utils.js';

let errorDesc = null;
const ROUTER_ERR_DESC_FILE = 'localiztion/str_err.js';
const ROUTER_UNK_ERR_MESSAGE = 'Unknown router error';

export const axiosInstance = axios.create({
  timeout: 20000,
});

export const userRpm = {
  STATUS: 'StatusRpm.htm',
  QUICK_SETUP: 'WzdStartRpm.htm',
  WLAN_SECURITY: 'WlanSecurityRpm.htm',
  WAN_DYNAMIC_IP: 'WanDynamicIpCfgRpm.htm',
  REBOOT: 'SysRebootRpm.htm',
};

export const routerDefaults = {
  name: 'TLWR842ND',
  host: 'http://192.168.0.1',
  login: 'admin',
  password: 'admin',
};

export class RouterError extends Error {
  constructor(err) {
    let { message, code } = err ?? '';
    if (isStr(err)) message = err;

    super(message);
    this.name = this.constructor.name;
    this.code = code;

    if (isFunc(Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export const showError = err => {
  if (!(err instanceof Error)) return;

  const { code, message, name } = err;
  // show full error info
  if (name !== 'RouterError') throw err;
  // log router error
  const desc = [];
  if (isNumOrStr(code)) desc.push(code);
  if (isNonEmptyStr(message)) desc.push(message);
  console.error(desc.join(': '));
};

export const getRouterErrorByCode = async code => {
  if (!isNum(code)) return '';

  if (!errorDesc) {
    const res = await axiosInstance.get(
      `${routerDefaults.host}/${ROUTER_ERR_DESC_FILE}`
    );
    // reducing array with empty items into a hash
    let arr;
    eval(`${res.data}; arr = str_err`);
    errorDesc = arr.reduce((errorDesc, msg, code) => {
      if (msg) errorDesc[code] = msg;
      return errorDesc;
    }, {});
  }

  return errorDesc[code] ?? ROUTER_UNK_ERR_MESSAGE;
};
