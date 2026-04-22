/**
 * @license
 * Copyright 2024 Aglyn LLC
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

import { types } from 'mobx-state-tree'
import { PluginId } from '../../plugin-manager'
import { ComponentId, NodeId, NodeType } from '../../types'

// Interface for NodeModel
interface INodeModel {
  $id: string
  nodes?: NodeId[]
  name?: string
  type: NodeType | string
  pluginId?: PluginId
  componentId?: ComponentId
  parentId?: NodeId
  props: P
  sx?: JSX.SxProps
  className?: string
}

// Define a branch-level model with a reference to child nodes
// @ts-ignore
const NodeModel = types.model<INodeModel>('NodeModel', {
  $id: types.identifier,
  // children: types.maybe(
  //   // then typecast each array element to Instance<typeof INodeModel>
  //   types.array(types.late((): IAnyModelType => NodeModel)),
  // ),
  nodes: types.array(types.string),
  name: types.string,
  type: types.string,
  pluginId: types.string,
  componentId: types.string,
  parentId: types.string,
  props: types.model,
  sx: types.model,
  className: types.string,
})

const CanvasModel = types.model('NodeStoreModel', {
  nodes: types.map(NodeModel),
})

// Define the root-level model with a reference to child nodes
// @ts-ignore
export const TreeNodeModel = types.union(LeafModel, NodeModel)

// Create the root tree node
const rootNode = NodeModel.create({
  $id: 'Root',
  children: [
    {
      $id: 'Child1',
      children: [{ $id: 'Child1.1', hh: '' }, { $id: 'Child1.2' }],
    },
    {
      $id: 'Child2',
      children: [{ $id: 'Child2.1' }, { $id: 'Child2.2' }],
    },
    {
      $id: 'Child3',
    },
    {
      $id: 'Child4',
      aa: 'Child2',
    },
  ],
})

// Accessing data
console.log('node.store.ts rootNode.name', rootNode.name) // Output: Root
console.log('node.store.ts rootNode', rootNode.toJSON())
