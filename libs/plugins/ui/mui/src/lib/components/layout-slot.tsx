/**
 * @license
 * Copyright 2026 Aglyn LLC
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
import { mdiPageLayoutBody } from '@aglyn/shared-data-mdi'
import Box, { type BoxProps } from '@mui/material/Box'
import { Children, forwardRef } from 'react'
import { BUNDLE_ID } from '../constants/bundle-common'
import { generatePresetId } from '../utils/generate-preset-id'

// Component ids are persisted in layout documents; never rename.
export const ID: Aglyn.ComponentId = 'layoutSlot'

export interface LayoutSlotProps extends BoxProps {}

/**
 * Content outlet for shared layouts: marks where a bound screen's nodes are
 * grafted into the layout tree at composition time. With children (composed
 * or previewed) it is a plain passthrough region; empty, it renders a
 * dashed placeholder so layout designers can see the slot on the canvas.
 */
const LayoutSlot = forwardRef<HTMLDivElement, LayoutSlotProps>(
  (props, ref) => {
    const { children, sx, ...rest } = props
    const hasChildren = Children.count(children) > 0

    if (hasChildren) {
      return (
        <Box ref={ref} data-aglyn-layout-slot="" sx={sx} {...rest}>
          {children}
        </Box>
      )
    }

    return (
      <Box
        ref={ref}
        data-aglyn-layout-slot=""
        sx={[
          {
            minHeight: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: 'divider',
            borderRadius: 1,
            color: 'text.secondary',
            fontFamily: 'sans-serif',
            fontSize: 14,
            letterSpacing: 1,
            textTransform: 'uppercase',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...rest}
      >
        {'Screen content'}
      </Box>
    )
  },
)
LayoutSlot.displayName = 'LayoutSlot'

export const schema: Aglyn.ComponentSchema<LayoutSlotProps> = {
  $id: ID,
  pluginId: BUNDLE_ID,
  displayName: 'Layout Slot',
  description:
    "Marks where each bound screen's content renders inside this layout. One per layout.",
  category: Aglyn.ComponentCategory.LAYOUT,
  icon: {
    path: mdiPageLayoutBody.path,
    sx: { color: '#9c27b0' },
  },
  // The slot's children come from screen composition, never from the canvas.
  restrictChildren: [Aglyn.LinealDirectiveFlag.LIMIT_TO, { components: [] }],
  flags: {
    cloning: Aglyn.FEATURE_FLAG.DISABLED,
    dropping: Aglyn.FEATURE_FLAG.DISABLED,
  },
}

export const presets: Aglyn.PresetSchema[] = [
  {
    $id: generatePresetId(ID),
    type: Aglyn.NodeType.PRESET,
    displayName: 'Layout Slot',
    icon: {
      path: mdiPageLayoutBody.path,
      sx: { color: '#9c27b0' },
    },
    category: Aglyn.ComponentCategory.LAYOUT,
    data: {
      $id: null,
      componentId: ID,
      pluginId: BUNDLE_ID,
      props: {},
    },
  },
]

export default LayoutSlot
