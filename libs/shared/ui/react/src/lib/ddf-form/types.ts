import type { ComponentType } from 'react'
import type { FormRendererProps as DdfFormRendererProps } from '@data-driven-forms/react-form-renderer/form-renderer'
import type DdfSchema from '@data-driven-forms/react-form-renderer/common-types/schema'
import type DdfField from '@data-driven-forms/react-form-renderer/common-types/field'


export type FormSchema = DdfSchema
export type FormField = DdfField
export type FormTemplate = ComponentType<DdfFormRendererProps>

export enum FieldComponent {
  CHECKBOX = 'checkbox',
  DATE_PICKER = 'date-picker',
  ICON_SELECT = 'icon-select',
  RADIO = 'radio',
  SELECT = 'select',
  TEXT_FIELD = 'text-field',
  TEXTAREA = 'textarea',
  TIME_PICKER = 'time-picker',
}
