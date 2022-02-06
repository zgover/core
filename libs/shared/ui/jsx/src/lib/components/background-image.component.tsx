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

import {styled} from '@aglyn/shared-feature-themes'
import Box, {type BoxProps as MuiBoxProps} from '@mui/material/Box'


interface OverrideProps {
  url: string
  parallax?: boolean
}

export type BackgroundImageComponentProps = MuiBoxProps<any, OverrideProps>

const BackgroundImageComponent = styled(Box, {
  name: 'BackgroundImage',
  shouldForwardProp(propName) {
    return !(propName === 'url' || propName === 'parallax')
  },
})<BackgroundImageComponentProps>(({url, parallax}) => ({
  backgroundColor: 'inherit',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'bottom center',
  backgroundSize: 'cover',
  backgroundImage: `url(${url})`,
  backgroundAttachment: parallax ? 'fixed' : undefined,
}))

BackgroundImageComponent.displayName = 'BackgroundImageComponent'

export {BackgroundImageComponent}
export default BackgroundImageComponent
