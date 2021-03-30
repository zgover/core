/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import EventEmitter from 'events'
import type DdfSchema from '@data-driven-forms/react-form-renderer/common-types/schema'

const PKG_VERSION = JSON.stringify(process.env.PKG_VERSION ?? 'N/A')
const PRODUCTION = process.env.NODE_ENV === 'production'

export namespace SiteCore {
  export enum Event {
    INSTANCE_CREATED = 'siteApp.created-singleton-instance',
  }
  export enum RestrictType {
    NONE,
    LIMIT = 'limit',
    DISALLOW = 'disallow',
  }

  export type AnyProps = Record<string, unknown>

  export interface Component {
    _id: string
    ClassFn?: any
    name: string
    description?: string
    title?: string
    subtitle?: string
    icon?: any
    defaultProps?: Partial<AnyProps>
    propsSchema?: DdfSchema
    resolveProps?: <T>(...args: T[]) => Partial<AnyProps> | void
    options?: {
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
      restrictChildren?: [type: RestrictType, componentIds: string[]]
      restrictParents?: [type: RestrictType, componentIds: string[]]
    }
  }

  export interface Element {
    _id: string
    component?: Component | string
    children?: Element[]
    props: AnyProps
    temp?: boolean
    parent?: string
    name?: string
    description?: string
  }

  export type ComponentsMap = Map<string, ComponentModel>

  export class ComponentModel {
    constructor(public config: Component) {}
  }

}

export class SiteApp {
  public static readonly version: string = PKG_VERSION
  public static readonly production: boolean = PRODUCTION
  public static readonly development: boolean = !PRODUCTION
  public static readonly event: EventEmitter = new EventEmitter()

  private static instance: SiteApp
  private static components: SiteCore.ComponentsMap = new Map()

  /**
   * Get the currently living singleton instance
   * @throws
   * @returns {SiteApp} instance
   */
  public static getInstance(): SiteApp {
    if (this.instance instanceof SiteApp) {
      return this.instance
    }
    throw new Error("Instance doesn't exist! You must call createInstance(...) first!")
  }

  /**
   * Creates a new singleton instance of SiteApp
   * @throws
   */
  public static createInstance() {
    if (this.instance instanceof SiteApp) {
      throw new Error('Instance exist! You have already created an instance.')
    }
    this.instance = new SiteApp()
    this.event.emit(SiteCore.Event.INSTANCE_CREATED)
  }

  public static registerSiteComponent(component: any, options: SiteCore.Component) {
    const { _id, ...opts } = options
    if (this.components.has(_id)) {
      throw new Error(`SiteComponent with same ID(${_id}) already exists!`)
    }
    this.components.set(_id, new SiteCore.ComponentModel({
      ...opts, ClassFn: component, _id
    }))
  }

}

export function app() {
  return 'app'
}
