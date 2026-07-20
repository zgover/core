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

import { FieldComponentType } from '@aglyn/aglyn'

/**
 * First-class style controls beyond the base panel (AGL-540): layout,
 * colors, sizing, typography, borders & shadows, position & overflow, and
 * grid/flex-child fields, rendered as accordion groups in the styles
 * panel. Everything still writes through the responsive-sx pipeline, so
 * breakpoint scoping (AGL-333) applies to every field here.
 *
 * Consolidation (AGL-587): every style field has exactly one home. The
 * loose base form is gone — display/float live in Layout, color/
 * backgroundColor in Colors, the container gap controls in the Flexbox &
 * Grids accordion ({@link buildFlexGapGroup}), and the per-item flex
 * fields (grow/shrink/basis/order) in Grid & Flex Child.
 */
export interface StyleFieldGroup {
  $id: string
  label: string
  fields: Array<Record<string, unknown> & { name: string }>
}

const textField = (
  name: string,
  label: string,
  description: string,
  extra?: Record<string, unknown>,
) => ({
  component: FieldComponentType.TEXT_FIELD,
  name,
  label,
  description,
  ...extra,
})

const half = { FormFieldGridProps: { size: { xs: 12, sm: 6 } } }

const selectField = (
  name: string,
  label: string,
  description: string,
  values: string[],
) => ({
  component: FieldComponentType.SELECT,
  name,
  label,
  description,
  options: [
    { value: '', label: 'Default' },
    ...values.map((value) => ({ value, label: value })),
  ],
})

/**
 * Builds the style accordion groups. `presetColors` feeds the color
 * pickers with the site theme's palette, mirroring the base styles form.
 */
export function buildStyleFieldGroups(
  presetColors: string[],
): StyleFieldGroup[] {
  return [
    {
      $id: 'layout',
      label: 'Layout',
      fields: [
        {
          component: FieldComponentType.SELECT,
          name: 'display',
          label: 'Display Variant',
          description:
            'The display property specifies the display behavior (the type of rendering box) of an element.',
          options: [
            { value: '', label: 'Default' },
            { value: 'block', label: 'Block' },
            { value: 'inline', label: 'Inline' },
            { value: 'content', label: 'Contents' },
            { value: 'list-item', label: 'List Item' },
            { value: 'inline-block', label: 'Inline Block' },
            { value: 'flex', label: 'Flex' },
            { value: 'inline-flex', label: 'Inline Flex' },
            { value: 'grid', label: 'Grid' },
            { value: 'inline-grid', label: 'Inline Grid' },
            { value: 'table', label: 'Table' },
            { value: 'inline-table', label: 'Inline Table' },
            { value: 'table-caption', label: 'Table Caption' },
            { value: 'table-column', label: 'Table Column' },
            { value: 'table-column-group', label: 'Table Column Group' },
            { value: 'table-cell', label: 'Table Cell' },
            { value: 'table-row', label: 'Table Row' },
            { value: 'table-row-group', label: 'Table Row Group' },
            { value: 'table-header-group', label: 'Table Header Group' },
            { value: 'table-footer-group', label: 'Table Footer Group' },
            { value: 'none', label: 'None' },
            { value: 'initial', label: 'Initial' },
            { value: 'unset', label: 'Unset' },
          ],
        },
        {
          component: FieldComponentType.SELECT,
          name: 'float',
          label: 'Float',
          description:
            'The float property is used for positioning and formatting content e.g. let an image float left to the text in a container.',
          options: [
            { value: '', label: 'Default' },
            {
              value: 'inherit',
              label: 'Inherit',
              description:
                'The element inherits the float value of its parent',
            },
            {
              value: 'none',
              label: 'None',
              description:
                'The element does not float (will be displayed just where it occurs in the text)',
            },
            {
              value: 'left',
              label: 'Left',
              description: 'The element floats to the left of its container',
            },
            {
              value: 'right',
              label: 'Right',
              description:
                'The element floats to the right of its container',
            },
          ],
        },
      ],
    },
    {
      $id: 'colors',
      label: 'Colors',
      fields: [
        {
          component: FieldComponentType.COLOR_PICKER,
          name: 'color',
          label: 'Text Color',
          description: 'The text color of the element',
          presetColors,
          ...half,
        },
        {
          component: FieldComponentType.COLOR_PICKER,
          name: 'backgroundColor',
          label: 'Background Color',
          description: 'The background color of the element',
          presetColors,
          ...half,
        },
      ],
    },
    {
      $id: 'sizing',
      label: 'Sizing',
      fields: [
        textField('width', 'Width', 'CSS width, e.g. 320px, 50%, 20rem.', half),
        textField('height', 'Height', 'CSS height, e.g. 240px or 100vh.', half),
        textField(
          'minWidth',
          'Min Width',
          'Lower bound for the element width.',
          half,
        ),
        textField(
          'maxWidth',
          'Max Width',
          'Upper bound for the element width.',
          half,
        ),
        textField(
          'minHeight',
          'Min Height',
          'Lower bound for the element height.',
          half,
        ),
        textField(
          'maxHeight',
          'Max Height',
          'Upper bound for the element height.',
          half,
        ),
      ],
    },
    {
      $id: 'typography',
      label: 'Typography',
      fields: [
        textField(
          'fontSize',
          'Font Size',
          'CSS font size, e.g. 18px, 1.25rem.',
          half,
        ),
        selectField(
          'fontWeight',
          'Font Weight',
          'Thickness of the glyph strokes.',
          ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
        ),
        textField(
          'fontFamily',
          'Font Family',
          'Font stack, e.g. Georgia, serif. Prefer theme typography when possible.',
        ),
        textField(
          'lineHeight',
          'Line Height',
          'Line box height, e.g. 1.5 or 28px.',
          half,
        ),
        textField(
          'letterSpacing',
          'Letter Spacing',
          'Tracking between characters, e.g. 0.5px or 0.02em.',
          half,
        ),
        selectField(
          'textTransform',
          'Text Transform',
          'Capitalization applied to the rendered text.',
          ['none', 'uppercase', 'lowercase', 'capitalize'],
        ),
        selectField(
          'textDecoration',
          'Text Decoration',
          'Decorative line on the text.',
          ['none', 'underline', 'overline', 'line-through'],
        ),
      ],
    },
    {
      $id: 'borders',
      label: 'Borders & Shadows',
      fields: [
        textField(
          'border',
          'Border',
          'Border shorthand, e.g. 1px solid or 2px dashed.',
          half,
        ),
        {
          component: FieldComponentType.COLOR_PICKER,
          name: 'borderColor',
          label: 'Border Color',
          description: 'Color for the border shorthand above.',
          presetColors,
          ...half,
        },
        textField(
          'borderRadius',
          'Corner Radius',
          'Rounded corners, e.g. 8px, 50%, or a theme spacing number.',
          half,
        ),
        textField(
          'outline',
          'Outline',
          'Outline shorthand drawn outside the border, e.g. 2px solid.',
          half,
        ),
        {
          component: FieldComponentType.SELECT,
          name: 'boxShadow',
          label: 'Shadow',
          description:
            'Drop shadow. Pick a preset here, or type any CSS box-shadow ' +
            'under Classes & custom CSS.',
          options: [
            { value: '', label: 'Default' },
            { value: 'none', label: 'None' },
            { value: '0 1px 3px rgba(0,0,0,0.2)', label: 'Subtle' },
            { value: '0 4px 12px rgba(0,0,0,0.15)', label: 'Medium' },
            { value: '0 12px 32px rgba(0,0,0,0.25)', label: 'Large' },
          ],
        },
      ],
    },
    {
      $id: 'position',
      label: 'Position & Overflow',
      fields: [
        selectField(
          'position',
          'Position',
          'Positioning scheme; offsets below apply to non-static elements.',
          ['static', 'relative', 'absolute', 'fixed', 'sticky'],
        ),
        textField('top', 'Top', 'Offset from the top edge.', half),
        textField('right', 'Right', 'Offset from the right edge.', half),
        textField('bottom', 'Bottom', 'Offset from the bottom edge.', half),
        textField('left', 'Left', 'Offset from the left edge.', half),
        textField(
          'zIndex',
          'Z-Index',
          'Stacking order for positioned elements.',
          { type: 'number', ...half },
        ),
        selectField(
          'overflow',
          'Overflow',
          'What happens to content that does not fit the element box.',
          ['visible', 'hidden', 'clip', 'scroll', 'auto'],
        ),
        textField(
          'opacity',
          'Opacity',
          'Element transparency from 0 (invisible) to 1 (opaque).',
          { type: 'number', ...half },
        ),
        selectField(
          'cursor',
          'Cursor',
          'Pointer shown while hovering the element.',
          ['default', 'pointer', 'text', 'move', 'grab', 'not-allowed'],
        ),
      ],
    },
    {
      $id: 'grid',
      label: 'Grid & Flex Child',
      fields: [
        textField(
          'gridTemplateColumns',
          'Grid Columns',
          'Column track list for display: grid, e.g. repeat(3, 1fr).',
        ),
        textField(
          'gridTemplateRows',
          'Grid Rows',
          'Row track list for display: grid, e.g. auto 1fr auto.',
        ),
        selectField(
          'gridAutoFlow',
          'Grid Auto Flow',
          'How auto-placed grid items fill the tracks.',
          ['row', 'column', 'dense', 'row dense', 'column dense'],
        ),
        textField(
          'gridColumn',
          'Grid Column',
          'Column placement of this item, e.g. span 2 or 1 / 3.',
          half,
        ),
        textField(
          'gridRow',
          'Grid Row',
          'Row placement of this item, e.g. span 2 or 1 / 3.',
          half,
        ),
        // Per-item flex sizing (AGL-587): grow/shrink/basis/order live
        // together — they all describe this element as a flex/grid child.
        textField(
          'flexGrow',
          'Flex Grow',
          "Sets the flex grow factor of a flex item's main size.",
          { type: 'number', ...half },
        ),
        textField(
          'flexShrink',
          'Flex Shrink',
          'How much this flex item shrinks when space is tight.',
          { type: 'number', ...half },
        ),
        textField(
          'flexBasis',
          'Flex Basis',
          'Initial main size of this flex item, e.g. 200px or 30%.',
          half,
        ),
        textField(
          'order',
          'Order',
          'Visual order of this flex/grid item within its container.',
          { type: 'number', ...half },
        ),
      ],
    },
  ]
}

/**
 * Container gap controls rendered inside the Flexbox & Grids accordion
 * (AGL-587) — they configure the selected element AS a flex/grid
 * container, next to the alignment toggles, and write through the same
 * responsive-sx pipeline as every other group.
 */
export function buildFlexGapGroup(): StyleFieldGroup {
  return {
    $id: 'flex-gaps',
    label: 'Gaps',
    fields: [
      textField(
        'gap',
        'Gap',
        'Shorthand for row-gap and column-gap, e.g. 16px or 1rem.',
      ),
      textField(
        'rowGap',
        'Row Gap',
        "Size of the gutter between the container's rows.",
        half,
      ),
      textField(
        'columnGap',
        'Column Gap',
        "Size of the gutter between the container's columns.",
        half,
      ),
    ],
  }
}

/** Field names owned by a group — the only keys its save may touch. */
export function styleGroupFieldNames(group: StyleFieldGroup): string[] {
  return group.fields.map((field) => field.name)
}

/**
 * The sx partial a group save is allowed to produce: exactly its own
 * field names. Keys owned by other groups (or by the custom-CSS editor)
 * never appear, so one group's auto-save can never clear another's
 * values (AGL-540).
 */
export function computeStylePartial(
  fieldNames: readonly string[],
  values: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const partial: Record<string, unknown> = {}
  for (const name of fieldNames) {
    partial[name] = values?.[name]
  }
  return partial
}

/** Picks a group's own values out of the effective sx value map. */
export function pickStyleValues(
  fieldNames: readonly string[],
  values: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const name of fieldNames) {
    if (values && values[name] !== undefined) picked[name] = values[name]
  }
  return picked
}
