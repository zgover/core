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

import { AppUUN, getApp } from '@aglyn/core-data-framework'
import {
  AglynAppContext,
  ElementComponentsContextProvider,
  ElementsContextProvider,
} from '@aglyn/feature-renderer'
import { OverrideableComponentProps } from '@aglyn/shared-data-types'
import { DndContext } from '@dnd-kit/core'
import NoSsr from '@mui/material/NoSsr'
import { forwardRef, Fragment, useCallback } from 'react'
import { EditorComponent } from './editor.component'


export interface BuilderComponentProps extends OverrideableComponentProps {
  noSsr?: boolean
  appName?: AppUUN
}

const BuilderComponent = forwardRef<any, BuilderComponentProps>(
  function RefRenderFn(props, ref) {
    const {
      noSsr,
      appName,
      ...rest
    } = props
    const Wrapper = noSsr ? NoSsr : Fragment
    const appCallback = useCallback(() => getApp(appName), [appName])
    if (typeof document !== 'undefined') {
      console.log('page:/builder app', appCallback())
    }

    const handleDragStart = useCallback((...args) => {
      console.log('drag start', ...args)
    }, [])
    const handleDragEnd = useCallback((...args) => {
      console.log('drag end', ...args)
    }, [])

    return (
      <Wrapper>
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <AglynAppContext.Provider value={{getApp}}>
            <ElementComponentsContextProvider>
              <ElementsContextProvider>
                <EditorComponent ref={ref} {...rest} />
              </ElementsContextProvider>
            </ElementComponentsContextProvider>
          </AglynAppContext.Provider>
        </DndContext>
      </Wrapper>
    )
  },
)

BuilderComponent.displayName = 'BuilderComponent'
BuilderComponent.defaultProps = {}

export { BuilderComponent }
export default BuilderComponent
