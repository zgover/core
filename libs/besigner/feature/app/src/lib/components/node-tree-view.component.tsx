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

import * as Aglyn from '@aglyn/aglyn'
import { DndDragType } from '@aglyn/besigner-data-app'
import { type NodeId } from '@aglyn/core-data-foundation'
import {
  ICON_VARIANT_COLLAPSIBLE_CLOSE,
  ICON_VARIANT_COLLAPSIBLE_OPEN,
  ICON_VARIANT_MODIFY_DRAG,
} from '@aglyn/shared-data-enums'
import { useForkedRefs } from '@aglyn/shared-ui-jsx'
import { MdiIcon } from '@aglyn/shared-ui-mdi-jsx'
import { alpha, styled } from '@aglyn/shared-ui-theme'
import mergeSxProps from '@aglyn/shared-ui-theme/util/merge-sx-props'
import noop from '@aglyn/shared-util-tools/noop'
import {
  Box,
  type BoxProps,
  Collapse,
  type CollapseProps,
  Divider,
  IconButton,
  List as MuiList,
  ListItem as MuiListItem,
  ListItemButton as MuiListItemButton,
  listItemButtonClasses,
  type ListItemButtonProps as MuiListItemButtonProps,
  ListItemIcon as MuiListItemIcon,
  ListItemText as MuiListItemText,
} from '@mui/material'
import {
  type ChangeEvent,
  createContext,
  forwardRef,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { useAglynCanvasSetHovered } from '../hooks/use-aglyn-canvas-hovered'
import useAglynCanvasSelected from '../hooks/use-aglyn-canvas-selected'
import useLeafDrag from '../hooks/use-leaf-drag'
import useLeafDrop from '../hooks/use-leaf-drop'
import ElementIconComponent from './element-icon.component'

const TreeView = styled(MuiList)({
  alignItems: 'stretch',
  flexDirection: 'column',
  width: 'fit-content',
  minWidth: '100%',
})
const TreeItem = styled(MuiListItem)({
  alignItems: 'stretch',
  flexDirection: 'column',
})
const TreeItemButton = styled(MuiListItemButton, {
  shouldForwardProp(propName) {
    return propName !== 'depth'
  },
})<MuiListItemButtonProps & { depth: number }>((styles) => {
  const { theme, depth = 1 } = styles
  return {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 20 * depth + 24,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    [`&.${listItemButtonClasses.focusVisible}`]: {
      backgroundColor: alpha(
        theme.palette.secondary.dark,
        theme.palette.action.focusOpacity + 0.1,
      ),
      [`&:hover`]: {
        backgroundColor: alpha(
          theme.palette.secondary.dark,
          theme.palette.action.focusOpacity + 0.2,
        ),
      },
    },
    [`&.${listItemButtonClasses.selected}`]: {
      backgroundColor: alpha(
        theme.palette.tertiary.main,
        theme.palette.action.selectedOpacity,
      ),
      [`&:hover`]: {
        backgroundColor: alpha(
          theme.palette.tertiary.main,
          theme.palette.action.selectedOpacity + 0.2,
        ),
      },
      [`&.${listItemButtonClasses.focusVisible}`]: {
        backgroundColor: alpha(
          theme.palette.tertiary.main,
          theme.palette.action.activatedOpacity,
        ),
        [`&:hover`]: {
          backgroundColor: alpha(
            theme.palette.tertiary.main,
            theme.palette.action.selectedOpacity + 0.2,
          ),
        },
      },
    },
  }
})

interface NodeTreeSubListProps extends BoxProps {
  nodes: Aglyn.NodeId[]
  depth: number
  CollapseProps?: Partial<CollapseProps>
}

function NodeTreeSubList(props: NodeTreeSubListProps) {
  const { nodes, depth, sx, CollapseProps, ...rest } = props

  return (
    <Box sx={{ position: 'relative' }} {...rest}>
      <Divider
        orientation="vertical"
        sx={mergeSxProps(
          {
            position: 'absolute',
            height: 1,
            pl: `${20 * depth + 13}px`,
          },
          sx,
        )}
        // flexItem
      />
      <Collapse unmountOnExit {...CollapseProps}>
        <TreeView disablePadding>
          {nodes.map((nodeId) => (
            <NodeTreeItem key={nodeId} nodeId={nodeId} depth={depth} />
          ))}
        </TreeView>
      </Collapse>
    </Box>
  )
}

interface NodeTreeItemProps extends JSX.ComponentProps<typeof TreeItem> {
  nodeId: Aglyn.NodeId
  depth: number
}

function NodeTreeItem(props: NodeTreeItemProps) {
  const { nodeId, depth, ...rest } = props
  const node = Aglyn.screen.getNode(nodeId)
  const schema = Aglyn.components.getSchema(node?.componentId)
  const nodeLabel = Aglyn.screen.getNodeLabelShort(node)
  const hierarchy = Aglyn.screen.getNodeNavigationHierarchy(node)
  const isRootNode = Aglyn.screen.isRootNode(node)
  const dragEnabled = Aglyn.isFeatureEnabled(schema?.flags?.dragging)
  const nodeNodes = node?.nodes
  const hasNodes = Array.isArray(nodeNodes) && nodeNodes.length > 0
  const dndData = {
    $id: nodeId,
    componentId: node?.componentId,
    pluginId: schema?.pluginId,
    trail: hierarchy,
    restrictParent: schema?.restrictParent,
    restrictChildren: schema?.restrictChildren,
  }
  const [, dragHandle, dragPreview] = useLeafDrag(dndData, DndDragType.TREE)
  const [, dropRef] = useLeafDrop(dndData)
  const treeItemRef = useForkedRefs(dropRef, dragPreview)

  const [handleVisible, setHandleVisible] = useState(false)
  const handleMouseEnter = useCallback(() => {
    setHandleVisible(true)
  }, [])
  const handleMouseLeave = useCallback(() => {
    setHandleVisible(false)
  }, [])

  return (
    <TreeItem disablePadding {...rest}>
      <TreeViewContext.Consumer>
        {({
          expanded,
          selected,
          closeIcon,
          expandIcon,
          onItemSelect,
          onItemHover,
          onItemToggle,
          onItemFocus,
        }) => {
          const collapseIn = expanded?.some((i) => i === nodeId)

          return (
            <>
              <TreeItemButton
                ref={treeItemRef}
                selected={selected === nodeId}
                onClick={(e) => onItemSelect(e, nodeId)}
                onMouseEnter={(e) => onItemHover(e, nodeId)}
                onFocusVisible={(e) => onItemFocus(e, nodeId)}
                depth={depth}
                onMouseOver={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                autoFocus
                dense
              >
                <MuiListItemIcon
                  sx={{ minWidth: 24, position: 'absolute', left: 0 }}
                >
                  {!isRootNode && dragEnabled && (
                    <IconButton
                      ref={dragHandle}
                      color="default"
                      size="small"
                      sx={{
                        padding: '5px',
                        borderRadius: '4px',
                        visibility: handleVisible ? 'visible' : 'hidden',
                      }}
                    >
                      <MdiIcon
                        color="inherit"
                        fontSize="inherit"
                        path={ICON_VARIANT_MODIFY_DRAG.path}
                      />
                    </IconButton>
                  )}
                </MuiListItemIcon>

                <MuiListItemIcon sx={{ minWidth: 24 }}>
                  {hasNodes && (
                    <IconButton
                      color="default"
                      sx={{ padding: '4px', mx: '-4px' }}
                      onClick={(e) => onItemToggle(e, nodeId)}
                    >
                      {collapseIn ? closeIcon : expandIcon}
                    </IconButton>
                  )}
                </MuiListItemIcon>
                <MuiListItemIcon sx={{ minWidth: 20 }}>
                  <Box
                    component="div"
                    sx={{
                      fontSize: 14,
                      marginLeft: -0.5,
                      marginRight: 0.75,
                      padding: 0.2,
                      borderRadius: '0.25em',
                      backgroundColor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                      boxShadow: 1,
                      color: 'tertiary',
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <ElementIconComponent $id={nodeId} />
                  </Box>
                </MuiListItemIcon>
                <MuiListItemText
                  primary={nodeLabel}
                  primaryTypographyProps={{
                    noWrap: true,
                    maxWidth: '180px',
                    width: 'fit-content',
                    textOverflow: 'ellipsis',
                  }}
                />
              </TreeItemButton>
              {hasNodes && (
                <NodeTreeSubList
                  depth={depth + 1}
                  nodes={nodeNodes}
                  CollapseProps={{
                    in: collapseIn,
                  }}
                />
              )}
            </>
          )
        }}
      </TreeViewContext.Consumer>
    </TreeItem>
  )
}

const TreeViewContext = createContext<{
  expanded: Aglyn.NodeId[]
  selected: Aglyn.NodeId
  closeIcon?: JSX.Node
  expandIcon?: JSX.Node
  onItemSelect: (e: ChangeEvent<any>, id: Aglyn.NodeId) => void
  onItemToggle: (e: ChangeEvent<any>, id: Aglyn.NodeId) => void
  onItemHover: (e: ChangeEvent<any>, id: Aglyn.NodeId) => void
  onItemFocus: (e: ChangeEvent<any>, id: Aglyn.NodeId) => void
}>({
  expanded: [],
  selected: null,
  closeIcon: '●',
  expandIcon: '○',
  onItemSelect: noop,
  onItemToggle: noop,
  onItemHover: noop,
  onItemFocus: noop,
})

export interface NodeTreeViewProps
  extends Partial<Omit<JSX.ComponentProps<typeof TreeView>, 'children'>> {}

export const NodeTreeViewComponent = forwardRef<any, NodeTreeViewProps>(
  (props, ref) => {
    const { ...rest } = props
    const [selected, setSelected] = useAglynCanvasSelected()
    const setHovered = useAglynCanvasSetHovered()
    const hierarchy = Aglyn.screen.getNodeNavigationHierarchy(selected?.$id)
    const [manuallyExpanded, setManuallyExpanded] = useState<NodeId[]>([])

    const allExpanded = useMemo(
      () => [...hierarchy, ...manuallyExpanded],
      [hierarchy, manuallyExpanded],
    )

    const handleTreeItemSelect = useCallback(
      (e, $id) => {
        e.stopPropagation()
        e.preventDefault()
        setSelected((prev) => ({
          $id: $id && prev?.$id === $id ? undefined : $id,
        }))
      },
      [setSelected],
    )

    const handleTreeItemHover = useCallback(
      (e, $id) => {
        setHovered({ $id })
      },
      [setHovered],
    )

    const handleTreeItemFocus = useCallback(
      (e, $id) => {
        e.stopPropagation()
        setHovered({ $id })
      },
      [setHovered],
    )

    const handleTreeItemToggle = useCallback((e, id: NodeId) => {
      e.stopPropagation()
      e.preventDefault()
      setManuallyExpanded((prev) => {
        if (prev.some((i) => i === id)) {
          return [...prev].filter((i) => i !== id)
        }
        return [...prev, id]
      })
    }, [])

    return (
      <Box
        component="nav"
        id={'aglyn:node-tree-view'}
        aria-label="canvas nodes navigator"
      >
        <TreeView ref={ref} {...rest}>
          <TreeViewContext.Provider
            value={{
              expanded: allExpanded,
              selected: selected?.$id,
              closeIcon: (
                <MdiIcon
                  fontSize="small"
                  path={ICON_VARIANT_COLLAPSIBLE_CLOSE.path}
                />
              ),
              expandIcon: (
                <MdiIcon
                  fontSize="small"
                  path={ICON_VARIANT_COLLAPSIBLE_OPEN.path}
                />
              ),
              onItemFocus: handleTreeItemFocus,
              onItemHover: handleTreeItemHover,
              onItemSelect: handleTreeItemSelect,
              onItemToggle: handleTreeItemToggle,
            }}
          >
            <NodeTreeItem depth={0} nodeId={Aglyn.NODE_ROOT_ID} />
          </TreeViewContext.Provider>
        </TreeView>
      </Box>
    )
  },
)

NodeTreeViewComponent.displayName = 'NodeTreeViewComponent'
NodeTreeViewComponent.aglyn = true
NodeTreeViewComponent.defaultProps = {}

export default NodeTreeViewComponent
