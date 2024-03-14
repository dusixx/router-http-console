import { CustomError, TimeoutError } from './error.js';

const toStr = Object.prototype.toString;
export const typeOf = v => toStr.call(v).slice(8, -1);

export const isStr = v => typeof v === 'string';
export const isFunc = v => typeof v === 'function';
export const isNum = v => !isNaN(v - parseFloat(v));
export const isInt = v => isNum(v) && Number.isInteger(v);
export const isPositiveInt = v => isInt(v) && v > 0;
export const isArray = v => v && Array.isArray(v);
export const isNonEmptyStr = v => v && isStr(v);
export const isNumOrStr = v => isNum(v) || isNonEmptyStr(v);

export const msToTime = ms => [
  ms / (24 * 3600), // days
  (ms % (24 * 3600)) / 3600, // hours
  ((ms % (24 * 3600)) % 3600) / 60, // mins
  ((ms % (24 * 3600)) % 3600) % 60, // secs
];

export const makeURLParams = (params = {}) =>
  Object.entries(params)
    .reduce((res, [key, value]) => {
      res.push(`${key}=${value}`);
      return res;
    }, [])
    .join('&');

export const pause = ms => new Promise(_ => setTimeout(_, ms));

/**
 *
 * @param {function} action - result of which we are waiting for
 * @param {array} args - action arguments
 * @param {any} result - expected result
 * @param {number} delay - action polling period
 * @param {number} timeout - total waiting time
 */
export const waitForResult = ({ action, args, result, delay, timeout }) => {
  if (!isFunc(action)) throw TypeError('action must be a function');
  if (!isArray(args)) args = '';

  return new Promise(async (resolve, reject) => {
    let ret;
    let timeIsUp;
    let timerId;
    let actionError;

    // setting a timeout
    if (isPositiveInt(timeout)) {
      timerId = setTimeout(() => (timeIsUp = true), timeout);
    }
    // waiting for action result
    do {
      await pause(delay);
      try {
        ret = await action(...args);
      } catch (err) {
        actionError = err;
        break;
      }
    } while (!timeIsUp && ret !== result);

    clearTimeout(timerId);

    return actionError
      ? reject(actionError)
      : timeIsUp
      ? reject(new TimeoutError(`timeout of ${timeout}ms exceeded`))
      : resolve(result);
  });
};
