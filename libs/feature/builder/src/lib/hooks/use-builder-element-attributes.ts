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

import { BundleUId, ComponentId, ElementId, getBuilderStore } from '@aglyn/core-data-framework'
import { ELEMENT_ATTRIBUTE_PREFIX, ElementAttribute } from '@aglyn/feature-builder'
import { useAglynAppContext } from '@aglyn/feature-renderer'
import { IndexOf } from '@aglyn/shared-data-types'
import { useStoreMap } from 'effector-react'
import { useMemo } from 'react'


function buildAttributeKey(
  name: IndexOf<ElementAttribute>
): `${ELEMENT_ATTRIBUTE_PREFIX}${typeof name}` {
   return `${ELEMENT_ATTRIBUTE_PREFIX}${name}`
}

function computeActivityValue(self: boolean, child: boolean) {
  if (child) return 'child'
  if (self) return 'self'
  return false
}

export interface UseBuilderElementAttributesOptions {
  $id: ElementId
  componentId: ComponentId
  bundleId?: BundleUId
}

export const useBuilderElementAttributes = (opts: UseBuilderElementAttributesOptions) => {
  const {
    $id,
    componentId,
    bundleId
  } = opts

  const {getApp} = useAglynAppContext(),
    store = getBuilderStore(getApp(), {store: 'canvas'}),
    [
      isSelfSelected,
      isSelfHovered,
      isChildSelected,
      isChildHovered,
    ] = useStoreMap({
      store,
      keys: [$id],
      fn: (state, [$id]) => ([
        state?.selected?.$id === $id,
        state?.hovered?.$id === $id,
        state?.selected?.hierarchy?.some((i) => i === $id),
        state?.hovered?.hierarchy?.some((i) => i === $id)
      ])
    })


  return useMemo(() => {
    const selected = computeActivityValue(isSelfSelected, isChildSelected)
    const hovered = computeActivityValue(isSelfHovered, isChildHovered)

    return ({
      [buildAttributeKey(ElementAttribute.ELEMENT_ID)]: $id,
      [buildAttributeKey(ElementAttribute.COMPONENT_ID)]: componentId,
      [buildAttributeKey(ElementAttribute.BUNDLE_ID)]: bundleId,
      [buildAttributeKey(ElementAttribute.SELECTED)]: selected,
      [buildAttributeKey(ElementAttribute.HOVERED)]: hovered,
    })
  }, [
    $id,
    componentId,
    bundleId,
    isSelfSelected,
    isSelfHovered,
    isChildSelected,
    isChildHovered
  ])
}

export default useBuilderElementAttributes
