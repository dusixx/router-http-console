import { isStr, isFunc, isNonEmptyStr, isNum, isNumOrStr } from './utils.js';

export const parseTaggedValue = v => {
  const [res = ''] = isStr(v) ? v.match(/(?<=>)[^<]+/) ?? '' : '';
  return res;
};

export const parseRouterErrorCode = resp => {
  if (!isNonEmptyStr(resp)) return;
  const [, errCode] = resp.match(/var\s+errCode\s+=\s+.(\d+).;/i) ?? '';
  return errCode;
};

/**
 *
 * <select id|name|class={selectId|selectName|selectClass}...>
 *    <option value={valueNum}...>{name}</option>
 *    ...
 * </select>
 */
export const parseSelectOption = ({
  response: resp,
  selectId: sid,
  selectName: name,
  selectClass: cls,
  optionValue: value,
}) => {
  const id = isNonEmptyStr(sid)
    ? `id\\s*=\\s*${sid}`
    : isNonEmptyStr(name)
    ? `name\\s*=\\s*${name}`
    : isNonEmptyStr(cls)
    ? `class\\s*=\\s*${cls}`
    : '';

  if (!id || !isNonEmptyStr(resp) || !isNumOrStr(value)) return '';

  const re = new RegExp(
    `<select.+?${id}[\\s\\S]+?value\\s*=\\s*.${value}[^>]+>([^<]+)`,
    'i'
  );
  const [, optionText] = resp.match(re) ?? '';
  return optionText;
};

/**
 *
 * @param {*} resp
 * @returns
 */
export const parseRouterParaArrays = response => {
  if (!isNonEmptyStr(response)) return null;

  let arr;
  const res = {};
  const reParaArray = /var\s+(\S+)\s*=\s*(new\s+Array[^;]+\));/g;

  while ((arr = reParaArray.exec(response))) {
    let [, arrName, arrData] = arr;
    res[arrName] = eval(arrData);
  }
  return {
    parsedPara: res,
    response,
  };
};

/**
 *
 * @param {object} parsedPara - parsed para arrays {wlanPara: [], wanPara: [], ...}
 * @param {string} response - router raw response
 * @returns
 */
export const mapRouterPara = ({ parsedPara, paraMap, response }) =>
  Object.entries(paraMap).reduce((res, [paraName, { _alias, ...mapped }]) => {
    Object.entries(mapped).forEach(([key, idxOrFunc]) => {
      const propName = `${_alias ? `${_alias}.` : ''}${key}`;

      res[propName] = isFunc(idxOrFunc)
        ? idxOrFunc(parsedPara, response)
        : parsedPara[paraName][idxOrFunc];
    });
    return res;
  }, {});
