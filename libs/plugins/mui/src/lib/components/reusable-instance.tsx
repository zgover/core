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
import { mdiPackageVariant } from '@aglyn/shared-data-mdi'
import Box, { type BoxProps } from '@mui/material/Box'
import { forwardRef } from 'react'
import { BUNDLE_ID } from '../constants/bundle-common'

// Persisted in screen documents; never rename (see AGL-34 ADR).
export const ID: Aglyn.ComponentId = Aglyn.REUSABLE_INSTANCE_COMPONENT_ID

export interface ReusableInstanceProps extends BoxProps {
  /** Definition id in `hosts/{hostId}/components`; grafted at render time. */
  refId?: string
}

/**
 * Wrapper element for a reusable-component instance. On production surfaces
 * the compose step (`composeReusableComponentNodes`) grafts the definition
 * subtree inside, so this renders as a plain container. In the editor the
 * instance has no children (definitions aren't grafted into the editable
 * canvas), so the CSS `:empty` placeholder marks it visibly instead.
 */
const ReusableInstance = forwardRef<any, ReusableInstanceProps>(
  (props, ref) => {
    const { refId: _refId, children, sx, ...rest } = props
    return (
      <Box
        ref={ref}
        sx={[
          {
            '&:empty': {
              minHeight: 56,
              m: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: 'divider',
              borderRadius: 1,
            },
            '&:empty::after': {
              content: '"Reusable component"',
              color: 'text.secondary',
              fontSize: 12,
              letterSpacing: 1,
              textTransform: 'uppercase',
            },
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
        {...rest}
      >
        {children}
      </Box>
    )
  },
)
ReusableInstance.displayName = 'ReusableInstance'

export const schema: Aglyn.ComponentSchema<ReusableInstanceProps> = {
  $id: ID,
  pluginId: BUNDLE_ID,
  displayName: 'Reusable Component',
  category: Aglyn.ComponentCategory.SURFACE,
  icon: {
    path: mdiPackageVariant.path,
    sx: { color: '#9c27b0' },
  },
  flags: {
    // Instances are opaque: their content lives in the definition, so
    // nothing may be dropped inside from the canvas.
    dropping: Aglyn.FEATURE_FLAG.DISABLED,
  },
  attributes: [],
}

/**
 * No static presets: instances are inserted from per-host definitions, which
 * the console registers dynamically (category "Your components").
 */
export const presets: Aglyn.PresetSchema[] = []

export default ReusableInstance
