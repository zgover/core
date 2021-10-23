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

export * from './api'

export * from './constants/emitter'
export * from './constants/enums'
export * from './constants/error'
export * from './constants/logger'
export * from './constants/platform'
export * from './constants/symbol'
export * from './constants/version'

export * from './util/aglyn-is'
export * from './util/create-aglyn-component-element'
export * from './util/create-component-element-data'
export * from './util/create-component-element-id'
export * from './util/create-components-bundle'

export * from './types'

export {
  AglynBaseModelOptions,
  AglynBaseModel,
} from './models/aglyn-base.model'
export {
  AglynExtensionOptions,
  AglynExtensionT,
  AglynExtension,
} from './models/aglyn-extension.model'
export {
  AglynModuleBaseModelOptions,
  AglynAppModuleEffectListener,
  AglynModuleBaseModelT,
  AglynModuleBaseModel,
} from './models/aglyn-module-base.model'

export type {
  AglynAppOptions,
  AglynEffectOptions,
  AglynAppControllerT,
  AglynAppController,
} from './controllers/aglyn-app.controller'
export type {
  AglynExtensionTypeFields,
  AglynExtensionLoader,
  AglynExtensionControllerT,
  AglynExtensionController,
} from './controllers/aglyn-extension.controller'
export type {
  ContextStore,
  CreateStoreOptions,
  DeleteStoreOptions,
  GetStoreOptions,
  SetStoreOptions,
  AglynContextsControllerT,
  AglynContextsController,
} from './controllers/aglyn-contexts.controller'
export type {
  AglynCommandResolver,
  AglynCommandListener,
  AglynCommandResolverTypeFields,
  AglynCommandListenerTypeFields,
  AglynCommandParams,
  AglynCommandControllerT,
  AglynCommandController,
} from './controllers/aglyn-command.controller'
export { AglynCommandFlag } from './controllers/aglyn-command.controller'
export type {
  AglynComponentsBundle,
  AglynComponentSchema,
  BundleUId,
  ComponentId,
  AglynComponentsTypeFields,
  AglynComponentElement,
  AglynComponentElementTemplateData,
  ComponentsRegistryEntry,
  ComponentsRegistryKeys,
  ComponentsRegistryValues,
  AglynComponentClassElement,
  AglynComponentElementData,
  AglynComponentElementType,
  AglynComponentFunctionElement,
  AglynComponentIntrinsicElement,
  LinealOrder,
  TemplateSubElementData,
  AglynComponentsControllerT,
  AglynComponentsController,
} from './controllers/aglyn-components.controller'
export { LinealDirectiveFlag } from './controllers/aglyn-components.controller'
