/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import EventEmitter from 'events'
import { EventFlag, RestrictFlag } from '../constants/flags'
import pkg from '../../../../../package.json'
import DdfSchema from '@data-driven-forms/react-form-renderer/common-types/schema'


export const VERSION = JSON.stringify(pkg.version ?? 'N/A')
export const PRODUCTION = process.env.NODE_ENV === 'production'

export const emit: EventEmitter = new EventEmitter()
export const modules: ModuleMap = new Map()
export const _apps: Map<string, WebApp> = new Map()


export interface WebApp {
  readonly CREATED?: string
}

export interface AppOptions {
  id?: string
}

export function initializeApp(options?: AppOptions)

export type AnyProps = Record<string, unknown>

export interface Module {
  $id?: string
  declarations: Component[]
}

export type ModuleMap = Map<string, Module>

export interface Component<T = unknown> {
  $id: string
  ctor: T
  metadata: {
    displayName?: string
    description?: string
    title?: string
    subtitle?: string
    icon?: any
    propsSchema?: DdfSchema
    defaultProps?: Partial<AnyProps>
    resolveProps?: <T>(...args: T[]) => Partial<AnyProps> | void
    disableActions?: boolean
    disableBadge?: boolean
    disableCopying?: boolean
    disableDragging?: boolean
    disableDropping?: boolean
    disableEditing?: boolean
    disableNesting?: boolean
    disableOutline?: boolean
    disableRemoving?: boolean
    disableSelecting?: boolean
    restrictChildren?: [type: RestrictFlag, ids: string[]]
    restrictParents?: [type: RestrictFlag, ids: string[]]
  }
}

export interface ElementData {
  $id: string
  component?: Component | string
  children?: (ElementData | string)[]
  props: AnyProps
  temporary?: boolean
  parent?: string
  name?: string
  description?: string
}

export class WebApp {
  public static readonly VERSION: string = VERSION
  public static readonly PRODUCTION: boolean = PRODUCTION

  public static event: EventEmitter = new EventEmitter()
  public static modules: ModuleMap = new Map()
  public readonly CREATED = new Date().toUTCString()
  private static instance?: WebApp
  private constructor() {/*empty*/}
  public static getInstance(): WebApp {
    if (this.instance instanceof this) {
      return this.instance
    }
    this.instance = new this()
    this.event.emit(EventFlag.INSTANCE_CREATED, this, this.instance)
    return this.instance
  }


  public static init(): WebApp {
    return this.getInstance()
  }


  public static setModule(props: { $id: string; declarations: Component[] }) {
    const {$id, declarations} = props
    const module = {$id, declarations}
    this.modules.set($id, module)
    this.event.emit(EventFlag.SET_MODULE, this, module)
    return this
  }


  public static getComponent(props: { moduleId: string; componentId: string }) {
    const {moduleId, componentId} = props
    return this.modules.get(moduleId)?.declarations.find((m) => m.$id === componentId)
  }


  public static getComponents(props: { moduleId: string; componentId?: string[] }) {
    const {moduleId, componentId} = props
    return componentId
      ? componentId.map(i => this.getComponent({moduleId, componentId: i}))
      : this.modules.get(moduleId)?.declarations
  }


  public static setComponent(props: {
    moduleId: string
    $id: string
    ctor: Component['ctor']
    metadata?: Component['metadata']
  }) {
    const {moduleId, $id, ctor, metadata} = props
    const module = this.modules.get(moduleId) ?? {$id: moduleId, declarations: []}
    let component = module.declarations.find((i) => i.$id === $id)
    if (!component) {
      component = {$id, ctor, metadata}
      module.declarations.push(component)
    } else {
      component.$id = $id
      component.ctor = ctor
      component.metadata = metadata
    }
    this.modules.set(moduleId, module)
    this.event.emit(EventFlag.SET_COMPONENT, this, module)
    return this
  }
}

export const webApp = WebApp.getInstance()
