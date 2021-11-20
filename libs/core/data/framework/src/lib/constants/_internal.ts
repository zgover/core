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

import type { AglynCanvasController } from '../controllers/aglyn-canvas.controller'
import type { AppUUN } from '../types'
import type { AglynAppController } from '../controllers/aglyn-app.controller'
import type { AglynCommandsController } from '../controllers/aglyn-commands.controller'
import type { AglynComponentsController} from '../controllers/aglyn-components.controller'
import type { AglynContextsController } from '../controllers/aglyn-contexts.controller'
import type { AglynBuilderController } from '../controllers/aglyn-builder.controller'
import type { AglynExtensionsController } from '../controllers/aglyn-extensions.controller'


export const DEFAULT_ENTRY_NAME = '[DEFAULT]'

export const _apps: Map<AppUUN, AglynAppController> = new Map()
export const _extensionsControllers: Map<AppUUN, AglynExtensionsController> = new Map()
export const _commandsControllers: Map<AppUUN, AglynCommandsController> = new Map()
export const _componentsControllers: Map<AppUUN, AglynComponentsController> = new Map()
export const _builderControllers: Map<AppUUN, AglynBuilderController> = new Map()
export const _canvasControllers: Map<AppUUN, AglynCanvasController> = new Map()
export const _contextsControllers: Map<AppUUN, AglynContextsController> = new Map()
