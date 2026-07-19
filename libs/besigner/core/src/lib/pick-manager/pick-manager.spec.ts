/**
 * @jest-environment jsdom
 */
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
import {
  cancelPick,
  handlePickClick,
  isPicking,
  nodeElementLabel,
  startPick,
} from './pick-manager'

const NAV_MENU = 'muiNavMenu'

describe('pick-manager — canvas element picker (AGL-574)', () => {
  beforeAll(() => {
    Aglyn.components.registerComponent((() => null) as any, {
      $id: NAV_MENU,
      pluginId: 'test-plugin',
      displayName: 'Dropdown',
    } as any)
  })

  afterAll(() => {
    Aglyn.components.unregisterComponent(NAV_MENU)
    Aglyn.canvas.reset()
  })

  beforeEach(() => {
    Aglyn.canvas.reset()
    Aglyn.canvas.setNodes({
      [Aglyn.NODE_ROOT_ID]: {
        $id: Aglyn.NODE_ROOT_ID,
        type: 'node',
        parentId: Aglyn.NODE_ROOT_ID,
        componentId: 'div',
        props: {},
        sx: {},
        nodes: ['shop-menu'],
      },
      'shop-menu': {
        $id: 'shop-menu',
        type: 'node',
        parentId: Aglyn.NODE_ROOT_ID,
        componentId: NAV_MENU,
        pluginId: 'test-plugin',
        props: { children: 'Shop' },
        sx: {},
        nodes: [],
      },
    } as any)
  })

  afterEach(() => {
    // Abandon any pick a failing test left armed.
    cancelPick()
  })

  it('captures the clicked node id + label and exits pick mode', () => {
    const onPicked = jest.fn()
    expect(isPicking()).toBe(false)

    startPick(onPicked)
    expect(isPicking()).toBe(true)

    handlePickClick('shop-menu')

    expect(onPicked).toHaveBeenCalledTimes(1)
    // The picked selector is built from this raw id by the dialog; here we
    // assert the id + friendly label the canvas hands back.
    expect(onPicked).toHaveBeenCalledWith('shop-menu', 'Dropdown "Shop" (muiNavMenu)')
    expect(isPicking()).toBe(false)
  })

  it('derives a friendly label from componentId + first text child', () => {
    expect(nodeElementLabel('shop-menu')).toBe('Dropdown "Shop" (muiNavMenu)')
    // Unknown node → safe fallback, never a throw.
    expect(nodeElementLabel('does-not-exist')).toBe('Element')
  })

  it('cancelPick aborts without firing the pick handler', () => {
    const onPicked = jest.fn()
    const onCancel = jest.fn()

    startPick(onPicked, { onCancel })
    cancelPick()

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onPicked).not.toHaveBeenCalled()
    expect(isPicking()).toBe(false)
  })

  it('Escape cancels the in-flight pick', () => {
    const onPicked = jest.fn()
    const onCancel = jest.fn()

    startPick(onPicked, { onCancel })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onPicked).not.toHaveBeenCalled()
    expect(isPicking()).toBe(false)
  })

  it('ignores clicks when not picking', () => {
    const onPicked = jest.fn()
    startPick(onPicked)
    handlePickClick('shop-menu')
    // Second click after teardown must not re-fire the (already spent) handler.
    handlePickClick('shop-menu')
    expect(onPicked).toHaveBeenCalledTimes(1)
  })

  it('a new pick supersedes an unfinished one', () => {
    const first = jest.fn()
    const second = jest.fn()
    startPick(first)
    startPick(second)
    handlePickClick('shop-menu')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
