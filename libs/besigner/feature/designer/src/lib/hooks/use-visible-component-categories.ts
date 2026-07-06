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
import useAglynBesignerFlag from './use-aglyn-besigner-flag'

function isLayoutOnlyPreset(preset: Aglyn.PresetSchema | undefined) {
  return preset?.data?.componentId === Aglyn.LAYOUT_SLOT_COMPONENT_ID
}

/**
 * Component-drawer categories filtered by the current canvas view type:
 * layout-only components (the LayoutSlot outlet) are hidden while editing
 * screens. Call inside an observer component — the category list is a MobX
 * computed.
 */
export function useVisibleComponentCategories() {
  const [viewType] = useAglynBesignerFlag('viewType')
  const categories = Aglyn.components.schemasBySortedCategories
  if (viewType === Aglyn.HostViewType.LAYOUT) return categories
  return categories
    .map((category) => ({
      ...category,
      items: category.items?.filter(
        (item) => !isLayoutOnlyPreset(item as Aglyn.PresetSchema),
      ),
    }))
    .filter((category) => category.items?.length)
}

export default useVisibleComponentCategories
