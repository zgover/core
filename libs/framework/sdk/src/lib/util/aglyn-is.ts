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
import {
  AglynApp,
  AglynAppModule,
  AglynCommandHandler,
  AglynExtension,
} from '@aglyn/framework/sdk'
import { _isObj } from '@aglyn/shared/util/guards'
import { AglynSymbol } from '../constants'


export function typeOf(object: unknown) {
  if (_isObj(object)) {
    const _typeof = object[AglynSymbol.TypeOf]
    switch (_typeof) {
      case AglynSymbol.MODULE_TYPE:
        // eslint-disable-next-line no-case-declarations
        const kind = object['kind']

        switch (kind) {
          case AglynSymbol.COMMAND_TYPE:
          case AglynSymbol.EXTENSION_TYPE:
          default:
            return kind
        }
      case AglynSymbol.APP_TYPE:
      default:
        return _typeof
    }
  }

  return undefined
}

export function isApp<T>(object: unknown): object is AglynApp {
  return typeOf(object) === AglynSymbol.APP_TYPE
}
export function isAppModule<T>(object: unknown): object is AglynAppModule {
  return typeOf(object) === AglynSymbol.MODULE_TYPE
}
export function isCommand<T>(object: unknown): object is AglynCommandHandler {
  return typeOf(object) === AglynSymbol.COMMAND_TYPE
}
export function isExtension<T>(object: unknown): object is AglynExtension {
  return typeOf(object) === AglynSymbol.EXTENSION_TYPE
}
