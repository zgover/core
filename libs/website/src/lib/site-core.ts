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

export enum RestrictType {
  NONE,
  LIMIT = 'limit',
  DISALLOW = 'disallow',
}
export enum ScEvent {
  INSTANCE_CREATED = 'site_core.created-instance',
}

export type ScElementProps = Record<string, unknown>

export interface ScComponent {
  _id: string
  ClassFn: any
  name: string
  description?: string
  title?: string
  subtitle?: string
  icon?: any
  defaultProps?: Partial<ScElementProps>
  propsSchema?: DdfSchema
  resolveProps?: <T>(...args: T[]) => Partial<ScElementProps> | void
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

export interface ScElement {
  _id: string
  component?: ScComponent | string
  children?: ScElement[]
  props: ScElementProps
  temp?: boolean
  parent?: string
  name?: string
  description?: string
}

export class SiteCore {
  public static readonly version: string = PKG_VERSION
  public static readonly production: boolean = PRODUCTION
  public static readonly development: boolean = !PRODUCTION
  public static readonly event: EventEmitter = new EventEmitter()

  private static instance: SiteCore
  private static components: Map<string, InstanceType<typeof SiteCore.ScComponent>> = new Map()

  /**
   * Get the currently living singleton instance
   * @throws
   * @returns {SiteCore} instance
   */
  public static getInstance(): SiteCore {
    if (this.instance instanceof SiteCore) {
      return this.instance
    }
    throw new Error("Instance doesn't exist! You must call createInstance(...) first!")
  }

  /**
   * Creates a new singleton instance of SiteCore
   * @throws
   */
  public static createInstance() {
    if (this.instance instanceof SiteCore) {
      throw new Error('Instance exist! You have already created an instance.')
    }
    this.instance = new SiteCore()
    this.event.emit(ScEvent.INSTANCE_CREATED)
  }

  public static registerSiteComponent(component: any, options: ScComponent): InstanceType<typeof SiteCore.ScComponent> {
    return new SiteCore.ScComponent()
  }

  private static ScComponent = class {}
}

export function siteCore() {
  return 'site-core'
}
