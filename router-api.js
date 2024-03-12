import {
  isNum,
  isNonEmptyStr,
  makeURLParams,
  pause,
  waitForResult,
} from './helpers/utils.js';

import {
  dhcpWanParaMap,
  statusParaMap,
  wlanPSKParaMap,
} from './helpers/parse-maps.js';

import {
  userRpm,
  routerDefaults,
  RouterError,
  axiosInstance,
  getRouterErrorByCode,
} from './helpers/router-utils.js';

import {
  parseRouterParaArrays,
  mapRouterPara,
  parseRouterErrorCode,
} from './helpers/parse.js';

import { performance } from './helpers/process.js';

//
// TLWR842ND
//
export default class Router {
  static #instance;
  #fetchTimeout;
  host;

  static get name() {
    return routerDefaults.name;
  }

  /**
   *
   * @param {string} url
   * @param {object} params
   * @param {object} config - axios config
   * @returns
   */
  async #fetch({ url, params, config }) {
    let res = null;
    const pstr = makeURLParams(params);
    const qstr = `${this.host}/userRpm/${url}${pstr ? `?${pstr}` : ''}`;
    const conf = { ...config };

    if (isNum(this.#fetchTimeout)) conf.timeout = this.#fetchTimeout;

    try {
      res = await axiosInstance.get(qstr, conf);
    } catch (err) {
      throw new RouterError(err);
    }

    const code = parseRouterErrorCode(res.data);
    if (code) {
      const message = await getRouterErrorByCode(code);
      throw new RouterError({ code, message });
    }

    return res.data;
  }

  constructor({ host = routerDefaults.host } = {}) {
    this.host = host;
    // singleton
    if (Router.#instance) return Router.#instance;
    Router.#instance = this;
  }

  async auth({ login: username, password } = {}) {
    // check username and password
    await this.#fetch({
      url: userRpm.QUICK_SETUP,
      config: {
        auth: {
          username,
          password,
        },
      },
    });
    axiosInstance.defaults.headers.common['Authorization'] = `Basic ${btoa(
      `${username}:${password}`
    )}`;
  }

  set fetchTimeout(tio) {
    this.#fetchTimeout = tio;
  }

  get fetchTimeout() {
    return this.#fetchTimeout;
  }

  get isAlive() {
    return (async () => {
      try {
        await this.#fetch({ url: userRpm.QUICK_SETUP });
        return true;
      } catch {
        return false;
      }
    })();
  }

  async getStatus() {
    const res = await this.#fetch({ url: userRpm.STATUS });
    const { parsedPara } = parseRouterParaArrays(res);

    return mapRouterPara({
      parsedPara,
      paraMap: statusParaMap,
    });
  }

  async getWanConType() {
    const res = await this.#fetch({ url: userRpm.STATUS });
    const { parsedPara: a } = parseRouterParaArrays(res);
    return a.wanPara[3];
  }

  async getWlanPSK() {
    const response = await this.#fetch({ url: userRpm.WLAN_SECURITY });
    const { parsedPara } = parseRouterParaArrays(response);

    return mapRouterPara({
      parsedPara,
      response,
      paraMap: wlanPSKParaMap,
    });
  }

  async getWanIp() {
    const res = await this.status;
    return res['wan.ip'];
  }

  async getDhcpWanStatus() {
    const response = await this.#fetch({ url: userRpm.WAN_DYNAMIC_IP });
    const { parsedPara } = parseRouterParaArrays(response);

    return mapRouterPara({
      parsedPara,
      response,
      paraMap: dhcpWanParaMap,
    });
  }

  async setDhcpWanHost(hostName) {
    // get current mtu size
    let res = await this.#fetch({ url: userRpm.WAN_DYNAMIC_IP });
    const { parsedPara: a } = parseRouterParaArrays(res);
    // set new hostname (mtu required)
    res = await this.#fetch({
      url: userRpm.WAN_DYNAMIC_IP,
      params: {
        hostName,
        save: 'save',
        mtu: a.dhcpInf[18],
      },
    });
    const { parsedPara: b } = parseRouterParaArrays(res);
    return b.dhcpInf[26] || "''";
  }

  async getDhcpWanHost() {
    const res = await this.#fetch({ url: userRpm.WAN_DYNAMIC_IP });
    const { parsedPara } = parseRouterParaArrays(res);
    return parsedPara.dhcpInf[26];
  }

  async reboot() {
    const start = performance.now();
    const action = async () => await this.isAlive;
    const delay = 500;

    await this.#fetch({
      url: userRpm.REBOOT,
      params: { reboot: 'reboot' },
    });
    // wait for offline
    this.#fetchTimeout = 2000;
    await waitForResult({
      action,
      delay,
      result: false,
    });
    // wait for online
    this.#fetchTimeout = 30000;
    await waitForResult({
      action,
      delay,
      result: true,
    });
    // restore defaults
    this.#fetchTimeout = null;
    // eta in seconds
    return Math.round(performance.now(start) / 1000);
  }
}
