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

import * as Aglyn from '@aglyn/aglyn'
import { DragType } from '@aglyn/besigner'
import { ICON_VARIANT_ELEMENT } from '@aglyn/shared-data-enums'
import { mergeRefs } from '@aglyn/shared-ui-jsx'
import { MdiIcon } from '@aglyn/shared-ui-mdi-jsx'
import { DragOverlay } from '@dnd-kit/core'
import {
  Box,
  Card,
  type CardProps,
  Grid,
  ListItemAvatar,
  ListItemText,
  Stack,
} from '@mui/material'
import { Observer, observer } from 'mobx-react-lite'
import { forwardRef } from 'react'
import { AccordionListComponent } from './accordion-list.component'
import Draggable from './dnd/draggable'

export type ComponentGridItemData =
  | Aglyn.PresetSchema<any>
  | Aglyn.ComponentSchema<any>

export type ComponentGridGroupItemData = {
  $id: string
  label: string
  items: ComponentGridItemData[]
}

export interface ComponentGridItemProps extends CardProps {
  node: ComponentGridItemData
}

const ComponentGridItem = observer(
  forwardRef<any, ComponentGridItemProps>((props, ref) => {
    const { node, ...rest } = props
    const label =
      node?.['label'] ||
      node?.displayName ||
      Aglyn.components.getLabel(node?.$id) ||
      node?.$id

    return (
      <Card
        ref={ref}
        variant="outlined"
        sx={{ height: 1, minHeight: 100, cursor: 'grab', zIndex: 99999 }}
        {...rest}
      >
        <Stack
          height={1}
          minHeight={100}
          alignItems="center"
          justifyContent="space-evenly"
          textAlign="center"
          p={0.25}
          spacing={0.5}
        >
          <ListItemAvatar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdiIcon
              {...node?.icon}
              sx={{ fontSize: '2rem' }}
              color="inherit"
              path={node?.icon?.path || ICON_VARIANT_ELEMENT.path}
            />
          </ListItemAvatar>
          <div>
            <ListItemText
              primaryTypographyProps={{
                fontWeight: 'fontWeightMedium',
                lineHeight: 'normal',
                fontSize: 'subtitle2.fontSize',
              }}
            >
              {label}
            </ListItemText>
          </div>
        </Stack>
      </Card>
    )
  }),
)
ComponentGridItem.displayName = 'ComponentGridItem'

interface ComponentAccordionListProp {}

export const ComponentAccordionList = observer(
  (props: ComponentAccordionListProp) => {
    const { ...rest } = props
    const items = Aglyn.components.schemasBySortedCategories

    return (
      <AccordionListComponent
        items={items}
        defaultExpanded={items.map((i) => i.$id)}
        getItemId={(item) => item?.$id}
        onRenderSummary={({ item }) => (
          <Observer>{() => <>{item?.label}</>}</Observer>
        )}
        onRenderDetail={({ item }) => (
          <Observer>
            {() => (
              <Box>
                <Grid spacing={2} container sx={{ overflowX: 'hidden' }}>
                  {item?.items?.map((node, index) => (
                    <Grid key={node?.$id ?? index} xs={6} item>
                      <Draggable
                        node={node}
                        type={DragType.PRESET}
                        idSuffix={item?.$id}
                      >
                        {({ draggable, node, forwardRef }) => (
                          <>
                            <ComponentGridItem
                              ref={mergeRefs(forwardRef, draggable.setNodeRef)}
                              node={node}
                              style={
                                draggable.isDragging ? { opacity: 0.5 } : {}
                              }
                              {...draggable.listeners}
                            />
                            <DragOverlay dropAnimation={null}>
                              {draggable.isDragging && (
                                <ComponentGridItem node={node} />
                              )}
                            </DragOverlay>
                          </>
                        )}
                      </Draggable>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Observer>
        )}
        {...rest}
      />
    )
  },
)
ComponentAccordionList.displayName = 'ComponentAccordionList'

export default ComponentAccordionList
