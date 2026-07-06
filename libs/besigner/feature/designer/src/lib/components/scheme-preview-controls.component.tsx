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

import {
  ICON_VARIANT_THEME_DARK,
  ICON_VARIANT_THEME_LIGHT,
} from '@aglyn/shared-data-enums'
import { MdiIcon } from '@aglyn/shared-ui-jsx'
import {
  IconButton as MuiIconButton,
  type IconButtonProps as MuiIconButtonProps,
  Tooltip as MuiTooltip,
} from '@mui/material'
import { forwardRef, useCallback } from 'react'
import useAglynBesignerFlag from '../hooks/use-aglyn-besigner-flag'

export interface SchemePreviewControlsProps
  extends Partial<MuiIconButtonProps> {}

/**
 * Toggles the color scheme the canvas previews the host theme in. Only the
 * artboard is affected — the surrounding console UI keeps its own theme.
 */
const SchemePreviewControlsComponent = forwardRef<
  any,
  SchemePreviewControlsProps
>((props, ref) => {
  const { ...rest } = props
  const [canvasScheme, setCanvasScheme] = useAglynBesignerFlag('canvasScheme')
  const isDark = canvasScheme === 'dark'

  const handleToggle = useCallback(() => {
    setCanvasScheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [setCanvasScheme])

  return (
    <MuiTooltip
      title={`Preview ${isDark ? 'light' : 'dark'} scheme on the artboard`}
    >
      <MuiIconButton
        ref={ref}
        aria-label="toggle artboard color scheme"
        size="small"
        color="inherit"
        onClick={handleToggle}
        {...rest}
      >
        <MdiIcon
          fontSize="inherit"
          path={
            isDark ? ICON_VARIANT_THEME_DARK.path : ICON_VARIANT_THEME_LIGHT.path
          }
        />
      </MuiIconButton>
    </MuiTooltip>
  )
})
SchemePreviewControlsComponent.displayName = 'SchemePreviewControlsComponent'
SchemePreviewControlsComponent.aglyn = true

export { SchemePreviewControlsComponent }
export default SchemePreviewControlsComponent
