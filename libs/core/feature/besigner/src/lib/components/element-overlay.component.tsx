/**
 * @license
 * Copyright 2021 Aglyn LLC
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

import {NoSsr} from '@mui/material'
import useAglynCanvasHovered from '../hooks/use-aglyn-canvas-hovered'
import useAglynCanvasSelected from '../hooks/use-aglyn-canvas-selected'
import ElementPopperComponent from './element-popper.component'


export interface ViewportPoppersComponentProps {

}

function ElementOverlayComponent(props: ViewportPoppersComponentProps) {
  const {
    ...rest
  } = props
  const selected = useAglynCanvasSelected()
  const hovered = useAglynCanvasHovered()

  return (
    <NoSsr defer>
      <ElementPopperComponent
        $id={selected?.$id}
        data-aglyn-overlay="selected"
        variant="overlaySelected"
      />
      <ElementPopperComponent
        $id={hovered?.$id}
        data-aglyn-overlay="hovered"
        variant="overlayHovered"
        {...(!selected?.$id || selected?.$id !== hovered?.$id ? {} : {
          open: false,
        })}
      />
    </NoSsr>
  )
}

ElementOverlayComponent.displayName = 'ElementOverlayComponent'

export {ElementOverlayComponent}
export default ElementOverlayComponent
