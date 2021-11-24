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

import {
  BuilderSetCanvasHoveredPayload,
  BuilderSetCanvasSelectedPayload,
  confirmValidLinealRelationship,
  setBuilderCanvasHovered,
  setBuilderCanvasSelected,
} from '@aglyn/core-data-framework'
import { useAglynAppContext, useAglynBuilderStore } from '@aglyn/feature-renderer'
import { useDndMonitor } from '@dnd-kit/core'
import { DragOverEvent } from '@dnd-kit/core/dist/types'
import Box from '@mui/material/Box'
import {
  ElementType,
  Fragment,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { HoverComponent, HoverComponentProps } from '../components/hover.component'
import { ActivityContext, HoverContext, HoveredOptions } from './hover-context'


export interface HoverContextProviderProps {
  defaultOptions?: Partial<HoveredOptions>
  children?: ReactNode
  component: ElementType<HoverComponentProps>
}

type ResolveReject<T = any> = [] | [
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
]

function HoverContextProviderRaw(props: HoverContextProviderProps) {
  const {children, defaultOptions, component: Component} = props

  // const [selectedOptions, setSelectedOptions] = useState<HoveredOptions>({...DEFAULT_OPTIONS,
  // ...defaultOptions})
  // const [selectedResolveReject, setSelectedResolveReject] = useState<ResolveReject>(() => [])

  // const [hoveredOptions, setHoveredOptions] = useState<HoveredOptions>({...DEFAULT_OPTIONS,
  // ...defaultOptions})
  // const [hoveredResolveReject, setHoveredResolveReject] = useState<ResolveReject>(() => [])


  const {getApp} = useAglynAppContext()
  const selectedOptions = useAglynBuilderStore('canvas', 'selected')
  const hoveredOptions = useAglynBuilderStore('canvas', 'hovered')

  const hoverRef = useRef<Element>()
  const selectedRef = useRef<Element>()

  const selectedOpen = Boolean(selectedOptions?.$id && hoverRef.current)
  const hoveredOpen = Boolean(hoveredOptions?.$id && selectedRef.current)

  const hoverOpen = useCallback((e: SyntheticEvent, opts: BuilderSetCanvasHoveredPayload) => {
    hoverRef.current = e.currentTarget
    setBuilderCanvasHovered(getApp(), opts)
  }, [])

  const hoverSelect = useCallback((e: SyntheticEvent, opts: BuilderSetCanvasSelectedPayload) => {
    selectedRef.current = e.currentTarget
    setBuilderCanvasSelected(getApp(), opts)
  }, [])

  const hoverClose = useCallback((e?: SyntheticEvent) => {
    setBuilderCanvasHovered(getApp(), {hovered: null})
    hoverRef.current = null
  }, [])
  const hoverDeselect = useCallback((e?: SyntheticEvent) => {
    setBuilderCanvasSelected(getApp(), {selected: null})
    setBuilderCanvasHovered(getApp(), {hovered: null})
    selectedRef.current = null
  }, [])

  const state = {
    selectedOptions,
    hoveredOptions,
    hoverOpen,
    hoverSelect,
    hoverClose,
    hoverDeselect,
  }

  const child = useMemo(() => {
    return (
      <HoverContext.Provider value={state}>
        {children}
      </HoverContext.Provider>
    )
  }, [children, state])

  const [over, setOver] = useState<DragOverEvent & { canDrop: boolean }>(null)

  useDndMonitor({
    onDragStart(event) {},
    onDragMove(event) {},
    onDragOver(event) {
      setOver({...event, canDrop: confirmValidLinealRelationship({item: {...event.active}, parent: {...event.over}})})
      console.log('event on drag over', event)
    },
    onDragEnd(event) {
      setOver(null)
    },
    onDragCancel(event) {},
  })

  const activityRef = useRef(null)

  // console.log('selectedOptions selectedOpen', selectedOptions, selectedOpen, hoveredOpen)

  return (
    <Fragment>
      <ActivityContext.Provider value={activityRef}>
        {child}
      </ActivityContext.Provider>
      <Box
        sx={{
          position: 'absolute',
          left: 0, top: 0,
          width: 1, height: 1,
          pointerEvents: 'none',
          '&>*': {pointerEvents: 'all'},
        }}
        ref={activityRef}
      >
        <Component
          open={hoveredOpen}
          anchorEl={hoverRef.current}
          options={hoveredOptions}
          onClose={hoverClose}
          variant={'hovered'}
        />

        <Component
          open={selectedOpen}
          anchorEl={selectedRef.current}
          options={selectedOptions}
          onClose={hoverDeselect}
          variant={'selected'}
        />


        {over && (
          <Box
            id={`aglyn:marker:${over.active.id}`}
            style={{
              // ...over?.over?.rect,
              // ...over?.delta,
              width: over?.over?.rect?.width,
              height: over?.over?.rect?.height,
              left: over?.over?.rect?.offsetLeft,
              top: over?.over?.rect?.offsetTop,
            }}
            sx={{
              position: 'absolute',
              display: 'block',
              pointerEvents: 'none',
              bgcolor: over.canDrop ? 'blue' : 'red',
              opacity: 0.25,
              // mt: -11.5,
            }}
          />
        )}
      </Box>
    </Fragment>
  )
}

HoverContextProviderRaw.displayName = 'HoverContextProvider'
HoverContextProviderRaw.defaultProps = {
  component: HoverComponent,
  defaultOptions: {},
}

export const HoverContextProvider = HoverContextProviderRaw
export default HoverContextProvider
