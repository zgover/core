/**
 * @license
 * Copyright 2022 Aglyn LLC
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

import { IAglynCanvasController } from '@aglyn/core-data-foundation'
import { LogLevelString } from '@aglyn/shared-util-logger'
import { ITimestamp, Timestamp } from '@aglyn/shared-util-timestamp'
import { type DecodeOptions, type EncodeOptions } from '@msgpack/msgpack'
import type { SplitUndefined } from '@msgpack/msgpack/src/context'
import UAParser from 'ua-parser-js'
import ComponentManager from './components-manager'
import {
  AglynEvent,
  emitter,
  errorFactory,
  lifecycleEvent,
  logger,
  setLogLevel,
} from './constants'
import DependencyManager, {
  type Dependency,
  type DependencyId,
} from './dependency-manager'
import { name, version } from './package'

const TAG = 'Aglyn'

export interface AglynConfig {
  logLevel?: LogLevelString
}

export class Aglyn {
  public static readonly namespace = name
  public static readonly version = version
  public static readonly platform = new UAParser()
  public static readonly errorFactory = errorFactory
  public static readonly logger = logger
  public static readonly emitter = emitter
  public static readonly components = ComponentManager

  private static singleton: Aglyn
  public static getInstance(appName?: string, config?: AglynConfig) {
    if (!Aglyn.singleton) Aglyn.singleton = new Aglyn(appName, config)
    return Aglyn.singleton
  }

  //region Properties
  readonly #createdAt: ITimestamp
  public get createdAt(): ITimestamp {
    return this.#createdAt
  }

  readonly #config: AglynConfig = {}
  public get config(): AglynConfig {
    return this.#config
  }

  #canvas: IAglynCanvasController = null
  public get canvas(): IAglynCanvasController {
    return this.#canvas
  }
  //endregion

  protected constructor(
    public readonly appName?: string,
    config?: AglynConfig,
  ) {
    this.#config = { ...config }
    this.#createdAt = Timestamp.now()
    this.setupLogger()
  }

  //region Setup/Breakdown
  private setupLogger() {
    setLogLevel(this.#config.logLevel)
  }
  //endregion

  //region Lifecycle Methods
  /** @ignore */
  public __initialize__(props?: never): this {
    lifecycleEvent(
      () => {
        this.onInitialize()
      },
      {
        startEvent: AglynEvent.APP_INITIALIZING,
        startPayload: [{ appName: Aglyn.namespace }],
        endEvent: AglynEvent.APP_INITIALIZED,
        endPayload: [{ appName: this.appName }],
      },
    )
    return this
  }
  /** @ignore */
  public __activate__(props?: never): this {
    lifecycleEvent(
      () => {
        this.onActivate()
      },
      {
        startEvent: AglynEvent.APP_ACTIVATING,
        startPayload: [{ appName: this.appName }],
        endEvent: AglynEvent.APP_ACTIVATED,
        endPayload: [{ appName: this.appName }],
      },
    )
    return this
  }
  /** @ignore */
  public __deactivate__(props?: never): this {
    lifecycleEvent(
      () => {
        this.onDeactivate()
      },
      {
        startEvent: AglynEvent.APP_DEACTIVATING,
        startPayload: [{ appName: this.appName }],
        endEvent: AglynEvent.APP_DEACTIVATED,
        endPayload: [{ appName: this.appName }],
      },
    )
    return this
  }
  /** @ignore */
  public __destroy__(props?: never): this {
    lifecycleEvent(
      () => {
        this.onDestroy()
      },
      {
        startEvent: AglynEvent.APP_DESTROYING,
        startPayload: [{ appName: this.appName }],
        endEvent: AglynEvent.APP_DESTROYED,
        endPayload: [{ appName: this.appName }],
      },
    )
    return this
  }

  public onInitialize(): this {
    return this
  }
  public onActivate(): this {
    return this
  }
  public onDeactivate(): this {
    return this
  }
  public onDestroy(): this {
    return this
  }
  //endregion

  //region Built-in
  public get [Symbol.toStringTag](): string {
    return TAG
  }
  public toString() {
    return `[object ${this[Symbol.toStringTag]}]`
  }
  public toJSON() {
    return {
      namespace: Aglyn.namespace,
      version: Aglyn.version,
      platform: Aglyn.platform,
      created: this.#createdAt.toJSON(),
      appName: this.appName,
      options: this.#config,
    }
  }
  //endregion
}

//region Dependency Management
export namespace Aglyn {
  export const depends: DependencyManager = new DependencyManager()
  export function addDependency(dependency: Dependency) {
    depends.addDependency(dependency)
    return this
  }
  export function removeDependency(dependencyId: DependencyId) {
    depends.removeDependency(dependencyId)
    return this
  }
  export function getDependency(dependencyId: DependencyId) {
    return depends.getDependency(dependencyId)
  }
}
//endregion

//region Compression/Decompression
export namespace Aglyn {
  export function encode<ContextType = undefined>(
    value: unknown,
    options?: EncodeOptions<SplitUndefined<ContextType>>,
  ): Uint8Array {
    return encode(value, options)
  }
  export function decode<ContextType = undefined>(
    buffer: ArrayLike<number> | BufferSource,
    options?: DecodeOptions<SplitUndefined<ContextType>>,
  ): unknown {
    return decode(buffer, options)
  }
}
//endregion

export default Aglyn

console.log('aglyn', Aglyn, Aglyn.getInstance(), Aglyn.depends)
