/**
 * @license
 * Copyright 2021 Aglyn LLC
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

import { replaceTemplate } from './tools'
import { ErrorTagMessages, ErrorTagPayloads, EventFlag, EventPayload } from './types'
import { NsError } from './ns-error'


/**
 * Standardized App Errors
 *
 * Usage:
 * ```typescript
 *   // Typescript string literals for type-safe codes
 *   type Err =
 *     'unknown' |
 *     'object-not-found'
 *     ;
 *
 *   // Closure enum for type-safe error codes
 *   // at-enum {string}
 *   var Err = {
 *     UNKNOWN: 'unknown',
 *     OBJECT_NOT_FOUND: 'object-not-found',
 *   }
 *
 *   let : Map<Err, string> = {
 *     'generic-error': "Unknown error",
 *     'file-not-found': "Could not find file: {$file}",
 *   };
 *
 *   // Type-safe function - must pass a valid error code as param.
 *   let error = new ErrorFactory<Err>('scope', 'Service', templates);
 *
 *   ...
 *   throw error.create(Err.GENERIC);
 *   ...
 *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
 *   ...
 *   // Service: Could not file file: foo.txt (scope/file-not-found).
 *
 *   catch (e) {
 *     assert(e.message === "Could not find file: foo.txt.");
 *     if (e.code === 'scope/file-not-found') {
 *       console.log("Could not read file: " + e['file']);
 *     }
 *   }
 * ```
 * @see inspired by:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
 */
export class NsErrorFactory<T extends string = EventFlag, U extends ErrorTagPayloads = ErrorTagPayloads> {

  constructor(
    private readonly scope: string,
    private readonly namespace: string,
    private readonly templates: ErrorTagMessages<T>,
    private readonly scopeDelimiter: string = '/',
  ) {}

  /**
   * Build a new throwable
   * @param flag error event identifier
   * @param args payload data to set template variable values
   * @returns {NsError}
   */
  create = <K extends T>(
    flag: K,
    ...args: K extends keyof U ? [U[K]] : []
  ): NsError => {
    const payload = (args[0] as EventPayload) || {}
    const fullCode = `${this.scope}${this.scopeDelimiter}${flag}`
    const template = this.templates[flag]
    const message = template ? replaceTemplate(template, payload) : 'Error'
    // Service Name: Error message (scope/flag).
    const fullMessage = `${this.namespace}: ${message} (${fullCode}).`
    return new NsError(fullCode, fullMessage, payload)
  }
}
