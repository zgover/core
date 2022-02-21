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

import dynamic from 'next/dynamic'


export const FieldIconSelect = dynamic(
  () => import('../components/icon-select.component').then((mod) => mod.default),
  {ssr: false},
)
export const FieldSelect = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/select').then((mod) => mod.default),
  {ssr: false},
)
export const FieldSwitch = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/switch').then((mod) => mod.default),
  {ssr: false},
)
export const FieldTextField = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/text-field').then((mod) => mod.default),
  {ssr: false},
)
export const FieldTextarea = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/textarea').then((mod) => mod.default),
  {ssr: false},
)
export const FieldPlainText = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/plain-text').then((mod) => mod.default),
  {ssr: false},
)
export const FieldSlider = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/slider').then((mod) => mod.default),
  {ssr: false},
)
export const FieldTimePicker = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/time-picker').then((mod) => mod.default),
  {ssr: false},
)
export const FieldDatePicker = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/date-picker').then((mod) => mod.default),
  {ssr: false},
)
export const FieldRadio = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/radio').then((mod) => mod.default),
  {ssr: false},
)
export const FieldCheckbox = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/checkbox').then((mod) => mod.default),
  {ssr: false},
)
export const FieldFieldArray = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/field-array').then((mod) => mod.default),
  {ssr: false},
)
export const FieldTabs = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/tabs').then((mod) => mod.default),
  {ssr: false},
)
export const FieldWizard = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/wizard').then((mod) => mod.default),
  {ssr: false},
)
export const FieldDualListSelect = dynamic(
  () => import('@data-driven-forms/mui-component-mapper/dual-list-select').then((mod) => mod.default),
  {ssr: false},
)
