/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

export namespace Res {

  export enum Status {
    SUCCESS = 'success',
    ERROR = 'error',
  }

  export type DataType = Record<string, unknown>
  export type ErrorType = {
    code: string
    message: string
    statusCode: number
  }

  export interface Response {
    status: Status
  }

  export interface DataResponse extends Response {
    data: DataType
  }

  export interface ErrorResponse extends Response {
    error: ErrorType
  }

  export type ResponseType = DataResponse | ErrorResponse

  const buildResponse = (
    data?: DataType,
    error?: ErrorType,
  ): ResponseType => {
    return error as ErrorType
      ? { status: Status.ERROR, error }
      : { status: Status.SUCCESS, data }
  }

  export namespace Data {

    /////////////////
    // RESPONSES
    /////////////////
    export const success = buildResponse({})
  }

  export namespace Error {
    enum Prefix {
      BAD_REQ = 'bad-request',
      NO_AUTH = 'not-authorized',
      TOO_MANY = 'too-many-requests',
    }

    enum MsgCode {
      MISSING_HDR = 'missing-required-header',
      FAIL_ID_TOKEN_CHECK = 'id-token-verification-failed',
      FAIL_CSRF_TOKEN_CHECK = 'csrf-token-verification-failed',
      CREATE_SESSION_COOKIE = 'create-session-cookie',
      RATE_LIMIT_EXCEEDED = 'rate-limit-exceeded',
      METHOD_NOT_ALLOWED = 'method-not-allowed',
    }

    enum Message {
      INVALID_REQUEST = 'Invalid Request',
      LOGIN_REQUIRED = 'Login Required',
      NOT_AUTHORIZED = 'Not Authorized',
      TOO_MANY_REQUESTS = 'Too Many Requests',
      METHOD_NOT_ALLOWED = 'Method Not Allowed',
    }

    enum StatusCode {
      HTTP400 = 400,
      HTTP401 = 401,
      HTTP402 = 402,
      HTTP404 = 404,
      HTTP405 = 405,
      HTTP429 = 429,
      HTTP500 = 500,
    }

    const buildCode = (
      pfx: Prefix,
      code: MsgCode,
    ): string => `${pfx}/${code}`

    const buildError = (
      statusCode: number,
      pfx: Prefix,
      code: MsgCode,
      message: Message,
    ): ErrorResponse => buildResponse(null, {
      code: buildCode(pfx, code),
      message,
      statusCode,
    }) as ErrorResponse


    /////////////////
    // RESPONSES
    /////////////////

    export const missingHeader = buildError(
      StatusCode.HTTP400,
      Prefix.BAD_REQ,
      MsgCode.MISSING_HDR,
      Message.INVALID_REQUEST,
    )

    export const idTokenCheck = buildError(
      StatusCode.HTTP401,
      Prefix.NO_AUTH,
      MsgCode.FAIL_ID_TOKEN_CHECK,
      Message.LOGIN_REQUIRED,
    )

    export const csrfTokenCheck = buildError(
      StatusCode.HTTP401,
      Prefix.NO_AUTH,
      MsgCode.FAIL_CSRF_TOKEN_CHECK,
      Message.LOGIN_REQUIRED,
    )

    export const createSessionCookie = buildError(
      StatusCode.HTTP401,
      Prefix.NO_AUTH,
      MsgCode.CREATE_SESSION_COOKIE,
      Message.NOT_AUTHORIZED,
    )

    export const rateLimitCheck = buildError(
      StatusCode.HTTP429,
      Prefix.TOO_MANY,
      MsgCode.RATE_LIMIT_EXCEEDED,
      Message.TOO_MANY_REQUESTS,
    )

    export const requestMethodCheck = buildError(
      StatusCode.HTTP405,
      Prefix.BAD_REQ,
      MsgCode.METHOD_NOT_ALLOWED,
      Message.METHOD_NOT_ALLOWED,
    )
  }
}

export namespace Req {
  export enum Method {
    CONNECT = 'CONNECT',
    DELETE = 'DELETE',
    GET = 'GET',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
    PATCH = 'PATCH',
    POST = 'POST',
    PUT = 'PUT',
    TRACE = 'TRACE',
  }
}

export namespace Logger {
  export const traceError = (
    res: Res.ErrorResponse,
    error?: any,
  ) => console.trace(
    res.error.statusCode,
    res.error.message,
    `(code: ${res.error.code})`,
    error,
  )
}
