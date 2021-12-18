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

import {_isArr, _isStrT} from '@aglyn/shared-util-guards'
import MuiSvgIcon, {SvgIconProps as MuiSvgIconProps} from '@mui/material/SvgIcon'
import {forwardRef, useMemo} from 'react'
import {useMdiIcon} from '../hooks/use-mdi-icon'
import type {IconId} from '../types'


export interface MdiSvgIconProps extends Partial<Omit<MuiSvgIconProps, 'path'>> {
  iconIds?: IconId[] | IconId
}

const MdiSvgIcon = forwardRef<any, MdiSvgIconProps>(
  function RefRenderFn(props, ref) {
    const {iconIds, children: _, ...rest} = props

    const ids = useMemo(() => {
      return _isStrT(iconIds) || _isArr(iconIds)
        ? _isStrT(iconIds) ? [iconIds] : iconIds
        : []
    }, [iconIds])

    const icons = useMdiIcon(ids)

    return (
      <MuiSvgIcon ref={ref} {...rest}>
        {icons ? icons.map((icon, index) => (
          <path key={index} d={icon?.path} />
        )) : null}
      </MuiSvgIcon>
    )
  },
)

MdiSvgIcon.displayName = 'MdiSvgIcon'

export {MdiSvgIcon}
export default MdiSvgIcon
