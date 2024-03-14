import {
  isArray,
  isNonEmptyStr,
  isStr,
  isFunc,
  isNumOrStr,
  typeOf,
} from './utils.js';

export class CustomError extends Error {
  constructor(err) {
    super(String(err?.message ?? err ?? ''));
    if (typeOf(err) === 'Object') Object.assign(this, err);

    // name, stack
    this.name = this.constructor.name;
    if (isFunc(Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export class RouterError extends CustomError {}

export class TimeoutError extends CustomError {}

/**
 *
 * @param {Error} err - target Error instance
 * @param {Array} except - names of non-throwing Error instances
 */
export const handleError = ({ err, except }) => {
  if (!(err instanceof Error)) return;
  const { code, message, name } = err;

  // throwing an error
  const exceptName = isNonEmptyStr(except) ? [except] : except;
  if (isArray(exceptName)) {
    if (exceptName.every(v => name !== v)) throw err;
  }
  // print to the console
  const desc = [];
  if (isNumOrStr(code)) desc.push(code);
  if (isNonEmptyStr(message)) desc.push(message);
  console.error(`\n${desc.join(': ')}`);
};
