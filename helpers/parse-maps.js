import { parseTaggedValue, parseSelectOption } from './parse.js';
import { msToTime } from './utils.js';

export const statusParaMap = {
  statusPara: {
    _alias: 'general',
    firmware: 5,
    hardware: 6,

    uptime: ({ statusPara: a }) => {
      const arr = msToTime(a[4]);
      return `${~~arr[0]} days ${arr
        .slice(1)
        .map(v => `${~~v}`.padStart(2, '0'))
        .join(':')}`;
    },
  },

  lanPara: {
    _alias: 'lan',
    mac: 0,
    ip: 1,
    subnet: 2,
  },

  wlanPara: {
    _alias: 'wlan',
    ssid: 1,
    mac: 4,
    ip: 5,

    radio: ({ wlanPara: a }) => (a[0] ? 'enabled' : 'disabled'),

    channel: ({ wlanPara: a }) => (a[2] === 15 ? a[9] : a[2]),

    channelWidth: ({ wlanPara: a, wlanChannelWidthArray: b }) =>
      parseTaggedValue(b[a[6]]),

    mode: ({ wlanPara: a, wlanTypeStringArray: b }) =>
      parseTaggedValue(b[a[3]]),

    maxTxRate: ({ wlanPara: a, rateTable: b }) => b[(a[8] - 1) / 2],
  },

  wanPara: {
    _alias: 'wan',
    mac: 1,
    ip: 2,

    connectionType: ({ wanPara: a, wanTypeStringArray: b }) =>
      parseTaggedValue(b[a[3]]),

    subnetMask: 4,
    defaultGateway: 7,
    dns: 11,
  },
};

export const wlanPSKParaMap = {
  wlanPara: {
    enabled: ({ wlanPara: a }) => !!a[2],

    version: ({ wlanPara: a }, response) => {
      return (
        parseSelectOption({
          response,
          selectId: 'pskSecOpt',
          optionValue: a[3].charAt(2),
        }) ?? ''
      );
    },

    encryption: ({ wlanPara: a }, response) => {
      return (
        parseSelectOption({
          response,
          selectId: 'pskCipher',
          optionValue: a[14],
        }) ?? ''
      );
    },

    secret: 9,
    interval: 11,
  },
};

export const dhcpWanParaMap = {
  dhcpInf: {
    isObtainingParams: ({ dhcpInf: a }) => a[4] === 1,

    wanPortOn: ({ dhcpInf: a }) => a[4] !== 2,

    ip: 13,
    subnetMask: 14,
    defaultGateway: 15,
    mtuSize: 18,
    dnsEnabled: ({ dhcpInf: a }) => !!a[19],
    dns1: 20,
    dns2: 22,
    unicast: ({ dhcpInf: a }) => !!a[23],
    hostName: 26,
  },
};
