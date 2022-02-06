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

import {type IndexOf} from '@aglyn/shared-data-types'
import {type ComponentMapper} from '@data-driven-forms/react-form-renderer'
import dynamic from 'next/dynamic'


const FieldIconSelect = dynamic(
  () => import('./components/field-icon-select').then((mod) => mod.default),
  {ssr: false},
)
const Select = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/select').then((mod) => mod.default),
  {ssr: false},
)
const Switch = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/switch').then((mod) => mod.default),
  {ssr: false},
)
const TextField = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/text-field').then((mod) => mod.default),
  {ssr: false},
)
const Textarea = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/textarea').then((mod) => mod.default),
  {ssr: false},
)
const PlainText = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/plain-text').then((mod) => mod.default),
  {ssr: false},
)
const Slider = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/slider').then((mod) => mod.default),
  {ssr: false},
)
const TimePicker = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/time-picker').then((mod) => mod.default),
  {ssr: false},
)
const DatePicker = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/date-picker').then((mod) => mod.default),
  {ssr: false},
)
const Radio = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/radio').then((mod) => mod.default),
  {ssr: false},
)
const Checkbox = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/checkbox').then((mod) => mod.default),
  {ssr: false},
)
const FieldArray = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/field-array').then((mod) => mod.default),
  {ssr: false},
)
const Tabs = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/tabs').then((mod) => mod.default),
  {ssr: false},
)
const Wizard = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/wizard').then((mod) => mod.default),
  {ssr: false},
)
const DualListSelect = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/dual-list-select').then((mod) => mod.default),
  {ssr: false},
)

export const IS_OPTION_EQUAL_TO_VALUE = ((option: any, value: any) => option.value === value)

export enum FieldComponentTypeFlag {
  TEXT_FIELD = 'text-field',
  FIELD_ARRAY = 'field-array',
  CHECKBOX = 'checkbox',
  SUB_FORM = 'sub-form',
  RADIO = 'radio',
  TABS = 'tabs',
  TAB_ITEM = 'tab-item',
  DATE_PICKER = 'date-picker',
  TIME_PICKER = 'time-picker',
  ICON_PICKER = 'icon-picker',
  WIZARD = 'wizard',
  SWITCH = 'switch',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  PLAIN_TEXT = 'plain-text',
  BUTTON = 'button',
  INPUT_ADDON_GROUP = 'input-addon-group',
  INPUT_ADDON_BUTTON_GROUP = 'input-addon-button-group',
  DUAL_LIST_SELECT = 'dual-list-select',
  SLIDER = 'slider',
}

export enum FieldValidatorTypeFlag {
  REQUIRED = 'required',
  MIN_LENGTH = 'min-length',
  MAX_LENGTH = 'max-length',
  EXACT_LENGTH = 'exact-length',
  MIN_ITEMS = 'min-items',
  MIN_NUMBER_VALUE = 'min-number-value',
  MAX_NUMBER_VALUE = 'max-number-value',
  PATTERN = 'pattern',
  URL = 'url',
}

export enum FieldComponentType {
  TEXT_FIELD = 0xeac7,
  TEXTAREA = 0xeaca,
  CHECKBOX = 0xeacb,
  RADIO = 0xeacc,
  SELECT = 0xead2,
  SLIDER = 0xeacd,
  TIME_PICKER = 0xeace,
  DATE_PICKER = 0xead0,
  ICON_PICKER = 0xead1,
  SWITCH = 0xeae3,
  PLAIN_TEXT = 0xead1,
  DUAL_LIST_SELECT = 0xead8,
  FIELD_ARRAY = 0xead3,
  WIZARD = 0xead4,
  TABS = 0xead7,
  BUTTON = 0xeae1,
}

export enum FieldValidatorType {
  REQUIRED = 0xeac7,
  MIN_LENGTH = 0xeaca,
  MAX_LENGTH = 0xeacb,
  EXACT_LENGTH = 0xeacc,
  MIN_ITEMS = 0xead2,
  MIN_NUMBER_VALUE = 0xeacd,
  MAX_NUMBER_VALUE = 0xeace,
  PATTERN = 0xead0,
  URL = 0xead1,
}

export const FIELD_MAP_SELECT: IndexOf<ComponentMapper> = {
  component: Select,
  isClearable: true,
  size: 'small',
  variant: 'outlined',
  TextFieldProps: {
    color: 'secondary',
  },
  isOptionEqualToValue: IS_OPTION_EQUAL_TO_VALUE,
}
export const FIELD_MAP_SWITCH: IndexOf<ComponentMapper> = {
  component: Switch,
  size: 'medium',
  color: 'secondary',
}
export const FIELD_MAP_TEXT_FIELD: IndexOf<ComponentMapper> = {
  component: TextField,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_TEXTAREA: IndexOf<ComponentMapper> = {
  component: Textarea,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_PLAIN_TEXT: IndexOf<ComponentMapper> = {
  component: PlainText,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_SLIDER: IndexOf<ComponentMapper> = {
  component: Slider,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_TIME_PICKER: IndexOf<ComponentMapper> = {
  component: TimePicker,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_DATE_PICKER: IndexOf<ComponentMapper> = {
  component: DatePicker,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_RADIO: IndexOf<ComponentMapper> = {
  component: Radio,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_CHECKBOX: IndexOf<ComponentMapper> = {
  component: Checkbox,
  size: 'small',
  color: 'secondary',
}
export const FIELD_MAP_FIELD_ARRAY: IndexOf<ComponentMapper> = {
  component: FieldArray,
}
export const FIELD_MAP_TABS: IndexOf<ComponentMapper> = {
  component: Tabs,
  color: 'secondary',
}
export const FIELD_MAP_WIZARD: IndexOf<ComponentMapper> = {
  component: Wizard,
}
export const FIELD_MAP_DUAL_LIST_SELECT: IndexOf<ComponentMapper> = {
  component: DualListSelect,
}
export const FIELD_MAP_ICON_PICKER: IndexOf<ComponentMapper> = {
  component: FieldIconSelect,
  isClearable: true,
  size: 'small',
  isOptionEqualToValue: IS_OPTION_EQUAL_TO_VALUE,
}

export const componentMapper: ComponentMapper = {
  [FieldComponentType.SELECT]: FIELD_MAP_SELECT,
  [FieldComponentTypeFlag.SELECT]: FIELD_MAP_SELECT,
  [FieldComponentType.SWITCH]: FIELD_MAP_SWITCH,
  [FieldComponentTypeFlag.SWITCH]: FIELD_MAP_SWITCH,
  [FieldComponentType.TEXT_FIELD]: FIELD_MAP_TEXT_FIELD,
  [FieldComponentTypeFlag.TEXT_FIELD]: FIELD_MAP_TEXT_FIELD,
  [FieldComponentType.TEXTAREA]: FIELD_MAP_TEXTAREA,
  [FieldComponentTypeFlag.TEXTAREA]: FIELD_MAP_TEXTAREA,
  [FieldComponentType.PLAIN_TEXT]: FIELD_MAP_PLAIN_TEXT,
  [FieldComponentTypeFlag.PLAIN_TEXT]: FIELD_MAP_PLAIN_TEXT,
  [FieldComponentType.SLIDER]: FIELD_MAP_SLIDER,
  [FieldComponentTypeFlag.SLIDER]: FIELD_MAP_SLIDER,
  [FieldComponentType.TIME_PICKER]: FIELD_MAP_TIME_PICKER,
  [FieldComponentTypeFlag.TIME_PICKER]: FIELD_MAP_TIME_PICKER,
  [FieldComponentType.DATE_PICKER]: FIELD_MAP_DATE_PICKER,
  [FieldComponentTypeFlag.DATE_PICKER]: FIELD_MAP_DATE_PICKER,
  [FieldComponentType.RADIO]: FIELD_MAP_RADIO,
  [FieldComponentTypeFlag.RADIO]: FIELD_MAP_RADIO,
  [FieldComponentType.CHECKBOX]: FIELD_MAP_CHECKBOX,
  [FieldComponentTypeFlag.CHECKBOX]: FIELD_MAP_CHECKBOX,
  [FieldComponentType.FIELD_ARRAY]: FIELD_MAP_FIELD_ARRAY,
  [FieldComponentTypeFlag.FIELD_ARRAY]: FIELD_MAP_FIELD_ARRAY,
  [FieldComponentType.TABS]: FIELD_MAP_TABS,
  [FieldComponentTypeFlag.TABS]: FIELD_MAP_TABS,
  [FieldComponentType.WIZARD]: FIELD_MAP_WIZARD,
  [FieldComponentTypeFlag.WIZARD]: FIELD_MAP_WIZARD,
  [FieldComponentType.DUAL_LIST_SELECT]: FIELD_MAP_DUAL_LIST_SELECT,
  [FieldComponentTypeFlag.DUAL_LIST_SELECT]: FIELD_MAP_DUAL_LIST_SELECT,
  [FieldComponentType.ICON_PICKER]: FIELD_MAP_ICON_PICKER,
  [FieldComponentTypeFlag.ICON_PICKER]: FIELD_MAP_ICON_PICKER,
}
