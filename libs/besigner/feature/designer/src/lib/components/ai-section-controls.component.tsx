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

import { mdiAutoFix } from '@aglyn/shared-data-mdi'
import { MdiIcon } from '@aglyn/shared-ui-jsx'
import {
  IconButton as MuiIconButton,
  type IconButtonProps as MuiIconButtonProps,
  Tooltip as MuiTooltip,
} from '@mui/material'
import { forwardRef, useContext } from 'react'
import AiAssistContext from '../contexts/ai-assist-context'

export interface AiSectionControlsProps extends Partial<MuiIconButtonProps> {}

/**
 * Generate section (AGL-169): opens the host app's prompt dialog; the AI
 * proposes a node subtree that grafts into the canvas. Hidden when the
 * host app provides no callback (designer stays network-agnostic).
 */
const AiSectionControlsComponent = forwardRef<any, AiSectionControlsProps>(
  (props, ref) => {
    const { ...rest } = props
    const { onGenerateSection } = useContext(AiAssistContext)
    if (!onGenerateSection) return null

    return (
      <MuiTooltip title="Generate a section with AI">
        <MuiIconButton
          ref={ref}
          aria-label="generate section with ai"
          size="small"
          color="inherit"
          onClick={() => onGenerateSection()}
          {...rest}
        >
          <MdiIcon fontSize="inherit" path={mdiAutoFix.path} />
        </MuiIconButton>
      </MuiTooltip>
    )
  },
)
AiSectionControlsComponent.displayName = 'AiSectionControlsComponent'
AiSectionControlsComponent.aglyn = true

export { AiSectionControlsComponent }
export default AiSectionControlsComponent
