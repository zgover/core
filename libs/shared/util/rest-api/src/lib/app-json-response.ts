/**
 * @license
 * Copyright 2026 Aglyn LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  createHttpRefCode,
  HttpRefCodeSimple,
  HttpRefCodeSubject,
  HttpRefCodeTopic,
  HttpResponseStatus,
  HttpStatusCode,
} from '@aglyn/shared-data-enums'
import type { JsonResponse } from './types'

/**
 * App Router mirror of {@link nextHandleJsonResponse}: same `JsonResponse`
 * envelope, but returns a Web `Response` for `route.ts` handlers instead of
 * writing to a `NextApiResponse`. Keeps the on-the-wire shape byte-for-byte
 * identical so migrated routes stay client-compatible.
 */
export function appHandleJsonResponse(
  statusCode: HttpStatusCode,
  options?: JsonResponse,
): Response {
  const { error, errorCode, status, statusMessage, data } = options || {}
  const json: JsonResponse = {
    errorCode,
    error,
    status: status ?? true,
    statusCode: statusCode || HttpStatusCode.OK,
    statusMessage: statusMessage || 'No message provided.',
    data: data ?? null,
  }
  return Response.json(json, { status: json.statusCode })
}

/** App Router mirror of {@link nextHandleJsonSuccess}. */
export function appHandleJsonSuccess(data: unknown): Response {
  return appHandleJsonResponse(HttpStatusCode.OK, {
    status: HttpResponseStatus.SUCCESS,
    data,
  })
}

/** App Router mirror of {@link nextHandleJsonError}. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function appHandleJsonError(error: any): Response {
  const { code, statusCode, message, statusMessage } = error ?? {}
  const msg = message || statusMessage || HttpRefCodeSimple.INVALID_REQUEST
  const co = code || statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR
  return appHandleJsonResponse(co, {
    status: HttpResponseStatus.ERROR,
    statusMessage: msg,
    error,
    errorCode: createHttpRefCode(
      HttpRefCodeSimple.INVALID_REQUEST,
      HttpRefCodeSubject.INVALID_REQUEST,
      HttpRefCodeTopic.SERVER_ERROR,
    ),
  })
}
