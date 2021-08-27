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

import { ConfirmationProviderComponent, OverrideableComponentProps } from '@aglyn/shared/ui/react'
import { builderTheme } from '@aglyn/shared/ui/themes'
import { AglynComponentData } from '@aglyn/framework/sdk'
import { CanvasRendererComponent } from '@aglyn/framework/renderer'
import { ThemeProvider } from '@material-ui/core/styles'
import { forwardRef } from 'react'
import BuilderElementRendererComponent from './builder-element-renderer.component'
import AppBarComponent from './appbar.component'
import ElementDrawerContextProvider, { ElementDrawerContextProviderProps } from '../contexts/element-drawer-context.provider'
import SelectionContextProvider from '../contexts/selection-context-provider'
import NoSsr from '@material-ui/core/NoSsr'
import ElementsContextProvider from '../contexts/elements-context-provider'
import ElementsContext from '../contexts/elements-context'
import { SnackbarProvider } from 'notistack'
import { PanZoom } from 'react-easy-panzoom'


export interface BuilderComponentProps extends OverrideableComponentProps {
  elements?: AglynComponentData[]
  elementComponents: ElementDrawerContextProviderProps['elements']
}

export const BuilderComponent = forwardRef<any, BuilderComponentProps>(
  function RefRenderFn(props, ref) {
    const {
      component: Component,
      elements,
      elementComponents,
      ...rest
    } = props

    return (
      <NoSsr>
        <ThemeProvider theme={builderTheme}>
          <Component ref={ref} id="aglyn:builder" {...rest}>
            <ElementsContextProvider elements={elements}>
              <SnackbarProvider maxSnack={3}>
                <ConfirmationProviderComponent>
                  <SelectionContextProvider>
                    <ElementDrawerContextProvider elements={elementComponents}>
                      <PanZoom disabled>
                        <ElementsContext.Consumer>
                          {({elements}) => (
                            <CanvasRendererComponent
                              id="aglyn:canvas"
                              elements={elements}
                              elementRendererComponent={BuilderElementRendererComponent}
                            />
                          )}
                        </ElementsContext.Consumer>
                      </PanZoom>

                      <AppBarComponent id="aglyn:toolbar" />
                    </ElementDrawerContextProvider>
                  </SelectionContextProvider>
                </ConfirmationProviderComponent>
              </SnackbarProvider>
            </ElementsContextProvider>
          </Component>
        </ThemeProvider>
      </NoSsr>
    )
  },
)

BuilderComponent.displayName = 'BuilderComponent'
BuilderComponent.defaultProps = {
  component: 'div',
  elements: [],
}

export default BuilderComponent
