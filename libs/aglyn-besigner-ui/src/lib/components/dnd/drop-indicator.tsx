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
import {
  type ClientRect,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  useDndMonitor,
} from '@dnd-kit/core'
import { Box, type BoxProps, Stack } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { REGION } from '../../utils/droppable-region-utils'

type Orientation = 'vertical' | 'horizontal'

const DEFAULT = {
  region: REGION.CHILDREN,
  rect: {
    left: 0,
    top: 0,
    height: 0,
    right: 0,
    bottom: 0,
    width: 0,
  } as ClientRect,
}

export interface DropIndicatorProps extends Partial<BoxProps> {}

export const DropIndicator = observer(function DropIndicator(
  props: DropIndicatorProps,
) {
  const { ...rest } = props
  const [dragging, setDragging] = useState(false)
  const [region, setRegion] = useState<REGION>(REGION.CHILDREN)
  const [rect, setRect] = useState<ClientRect>({} as any)
  const before = region === REGION.LEFT || region === REGION.TOP
  const after = region === REGION.RIGHT || region === REGION.BOTTOM
  const asChild = region === REGION.CHILDREN

  useDndMonitor({
    onDragStart(event: DragStartEvent): void {
      setDragging(true)
    },
    onDragEnd(event: DragEndEvent): void {
      setDragging(false)
    },
    onDragMove(event: DragMoveEvent): void {
      const droppable = event.over
      setRect(droppable?.rect || DEFAULT.rect)
      setRegion(droppable?.data.current.region || DEFAULT.region)
    },
  })

  const beforeStyles = {
    left: rect.left - 4,
    top: rect.top - 4,
    height: rect.height + 8,
  }
  const afterStyles = {
    left: rect.left + rect.width - 4,
    top: rect.top - 4,
    height: rect.height + 8,
  }
  const childStyles = {
    left: rect.left + 4,
    top: rect.top + rect.height / 2 - 4,
    width: rect.width - 8,
  }

  return (
    <Stack
      direction={asChild ? 'row' : 'column'}
      style={{
        visibility: dragging ? 'visible' : 'hidden',
        position: 'absolute',
        ...(before ? beforeStyles : undefined),
        ...(after ? afterStyles : undefined),
        ...(asChild ? childStyles : undefined),
      }}
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      <Box
        sx={{
          bgcolor: 'surface.main',
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'secondary.dark',
          width: 8,
          height: 8,
        }}
      />
      <Box
        sx={{
          bgcolor: 'secondary.main',
          flexGrow: 1,
          width: asChild ? undefined : 3,
          height: asChild ? 3 : undefined,
        }}
      />
      <Box
        sx={{
          bgcolor: 'surface.main',
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'secondary.dark',
          width: 8,
          height: 8,
        }}
      />
    </Stack>
  )
})
DropIndicator.displayName = 'DropIndicator'

export default DropIndicator
