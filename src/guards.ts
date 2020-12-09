import { toNum } from './utils'

export function _isBool(val: any): val is boolean {
  return typeof val === 'boolean'
}
export function _isBig(val: any): val is bigint {
  return typeof val === 'bigint'
}
export function _isNumT(val: any): val is number {
  return typeof val === 'number'
}
export function _isNum(val: any, noStr?: boolean): val is number {
  return noStr && _isStr(val) ? false : Number(val) !== NaN
}
export function _isSym(val: any): val is symbol {
  return typeof val === 'symbol'
}
export function _isFn(val: any): val is Function {
  return typeof val === 'function'
}
export function _isArr<T>(val: T | {}): val is (T extends readonly any[] ? (unknown extends T ? never : readonly any[]) : any[]) {
  return Array.isArray<T>(val)
}
export function _isArrEmpty(val: any): val is [] {
  return _isArr(val) && !val.length
}
export function _isObjT(val: any): val is object {
  return typeof val === 'object'
}
export function _isObj(val: any): val is Object {
  return _isObjT(val) && !_isArr(val)
}
export function _isNull(val: any): val is null {
  return _isObjT(val) && typeof val === null
}
export function _isUndef(val: any): val is undefined {
  return typeof val === 'undefined'
}
export function _isUndOrNull(val: any): val is null | undefined {
  return _isNull(val) || _isUndef(val)
}
export function _isStr(val: any): val is string {
  return typeof val === 'string'
}
export function _isStrEmpty(val: any): val is '' {
  return _isStr(val) && !val.length
}
export function _isEmptyStrOrArr(val: any): val is '' | [] {
  return _isStrEmpty(val) && _isArrEmpty(val)
}
export function isBuffer(val: any): val is Buffer {
  return _isObjT(val) && _isObjT(val.constructor) && 'isBuffer' in val.constructor &&
    _isFn((val.constructor as any).isBuffer) && (val.constructor as any).isBuffer(val)
}
type Primitive = symbol | bigint | boolean | number | string | undefined
export function _isPrim(val: any): val is Primitive {
  return Boolean(
    _isSym(val)
    || _isBig(val)
    || _isNumT(val)
    || _isObjT(val)
    || _isBool(val)
    || _isStr(val)
    || _isFn(val)
    || _isUndef(val)
  )
}
export function hasLength<T extends Iterable<U> | ArrayLike<U> | number, U>(
  val: T,
  equalTo?: number | undefined,
  lessThan?: number | undefined,
  moreThan?: number | undefined,
  and?: true | undefined,
  also?: ((length: number, value?: U) => boolean) | undefined
): boolean {
  const immutable = _isNum(val) ? toNum(val) : val as unknown as Iterable<T> | ArrayLike<T>
  const len: number = _isNum(val) ? immutable : immutable.length
  const e = equalTo
  const l = lessThan
  const m = moreThan
  const et = _isNum(e)
  const lt = _isNum(l)
  const mt = _isNum(m)
  const func = _isFn(also) ? also : false
  const noOpt = !et && !lt && !mt
  const chkFunc = (firstCheck: boolean): boolean => {
    if (func)
      return and ? firstCheck && func(len, immutable) : firstCheck || func(len, immutable)
    return firstCheck
  }
  const chkOpt = (equal: boolean, less: boolean, more: boolean, chk: boolean): boolean => {
    return (et === equal && lt === less && mt === more && chkFunc(chk))
  }
  return Boolean(
    noOpt
      ? chkFunc(isPosNumber(len))
      : chkOpt(true, false, false, (len === e))
      || chkOpt(false, true, false, (len < l))
      || chkOpt(false, false, true, (len > m))
      || chkOpt(false, true, true, (and ? (len < l && len > m) : (len < l || len > m)))
      || chkOpt(true, true, false, (and ? (len === e && len < l) : (len === e || len < l)))
      || chkOpt(true, false, true, (and ? (len === e && len > m) : (len === e || len > m)))
      || chkOpt(
        true, true, true,
        (and ? (len === e && len < l && len > m) : (len === e || len < l || len > m))
      )
  )
}
export function isNegNumber(val: any): val is number & boolean {
  return (_isStr(val) ? parseInt(val) : Number(val)) < 0
}
export function isPosNumber(val: any): val is number & boolean {
  return toNum(val, 0) > 0
}
export function isZero(val: any): val is 0 {
  return toNum(val, false) === 0
}
export function isOneOf<U>(val: any, possible: Array<U>): val is U {
  return possible.some(i => val === i)
}
