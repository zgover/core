/**
 * @license
 * Copyright 2023 Aglyn LLC
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
import { ITimestamp } from '@aglyn/shared-util-timestamp'
import { NODE_ROOT_ID } from '../canvas-manager'
import { ComponentSchema } from '../components-manager'
import { VersionUid } from './screen'
import { AglynDocument } from './shared'
import { HostUid } from './workspace'

export interface AbstractNodeSchema<P = JSX.AnyProps> extends AglynDocument {
  /**
   * The unique identifier for a node
   */
  $id?: string
  name?: string
  title?: string
  displayName?: string
  description?: string

  children?: any
  nodes?: any

  data?: any
  attributes?: any
  /**
   * The node style properties for emotion
   */
  sx?: JSX.SxProps
  /**
   * The node props/attributes passed to the component
   */
  props?: P

  taxonomy?: any
  category?: any
  tags?: any
  icon?: any

  /**
   * The node type to describe the IST
   */
  type?: any
  kind?: any
  flags?: Record<string, boolean>

  createdAt?: ITimestamp
  updatedAt?: ITimestamp
  deletedAt?: ITimestamp

  inherits?: string

  versionId?: VersionUid
  /**
   * The unique identifier of the node component
   */
  componentId?: string
  /**
   * The unique identifier of the node parent
   */
  parentId?: string
  /**
   * The unique identifier of the node component plugin bundle
   */
  pluginId?: string
}

export enum NodeType {
  NODE = 'node',
  TEXT = 'text',
  NUMBER = 'number',
  SCREEN = 'screen',
  REF = 'ref',
  PRESET = 'preset',
}

export type NodeId = string

export interface NodeSchema<P = JSX.AnyProps> extends AbstractNodeSchema<P> {
  /**
   * List of the children unique identifiers for the node
   */
  nodes?: NodeId[]
  /**
   * Class name to pass the DOM node, can also be defined in props
   */
  className?: string
  /**
   * The computed node parent (only for type completion)
   */
  readonly parent?: NodeSchema<any> | null
  /**
   * The computed node parent (only for type completion)
   */
  readonly children?: NodeSchema<any>[]
  /**
   * The computed index in parent nodes (only for type completion)
   */
  readonly index?: number | null
  /**
   * The computed label (only for type completion)
   */
  readonly labelShort?: string | undefined
  /**
   * The computed breadcrumb path (only for type completion)
   */
  readonly breadcrumbPath?: NodeBreadcrumbPath
  /**
   * The computed component schema (only for type completion)
   */
  readonly componentSchema?: ComponentSchema | undefined
  /**
   * The computed guard for of child nodes (only for type completion)
   */
  readonly hasNodes?: boolean
  /**
   * The computed property for the resolved props from component schema
   */
  readonly resolvedProps?: P
}

export type NodeSchemaJSON<P = JSX.AnyProps> = Omit<
  NodeSchema<P>,
  | 'parent'
  | 'index'
  | 'labelShort'
  | 'breadcrumbPath'
  | 'componentSchema'
  | 'hasNodes'
>

export type NodeSchemaNested<P = JSX.AnyProps> = Omit<
  NodeSchemaJSON<P>,
  'nodes'
> & { nodes?: NodeSchemaNested<any>[] }

export type NodesMap = Record<NodeId, NodeSchema<any>>

export interface ScreenSchema {
  nodes: NodeSchemaNested
  createdAt?: ITimestamp
  updatedAt?: ITimestamp
  hostId?: HostUid
}

export type NodeBreadcrumbPath = [
  root: string & typeof NODE_ROOT_ID,
  ...nodes: [...ancestors: NodeId[], node: NodeId],
]

export type ProcessableNodes =
  | NodeSchemaNested<any>[]
  | NodeSchemaNested<any>
  | Record<NodeId, NodeSchema>
