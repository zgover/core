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

import {FormFieldGrid, validationError} from '@data-driven-forms/mui-component-mapper'
import {useFieldApi, type UseFieldApiComponentConfig} from '@data-driven-forms/react-form-renderer'
import {type GridProps, TextField as MuiTextField, type TextFieldProps} from '@mui/material'
import {useCallback, useState} from 'react'
import {SketchPicker, SketchPickerProps} from 'react-color'


type InternalColorPickerProps = Partial<TextFieldProps> & {
  FormFieldGridProps: GridProps;
  ColorPickerProps: Partial<SketchPickerProps>
}

export type ColorPickerProps = InternalColorPickerProps & UseFieldApiComponentConfig


const ColorPickerComponent = (props: ColorPickerProps) => {
  const {
    input,
    isReadOnly,
    isDisabled,
    placeholder,
    isRequired,
    label,
    helperText,
    description,
    validateOnMount,
    meta,
    inputProps,
    FormFieldGridProps,
    ColorPickerProps,
    defaultValue,
    onChange,
    ...rest
  } = useFieldApi(props as any)
  console.log('defaultValue', rest, defaultValue, input)
  const invalid = validationError(meta, validateOnMount)
  const [value, setValue] = useState(defaultValue || '')
  const handleChange = useCallback((value: string, e: any) => {
    console.log('handleChange', value, e)
    setValue(value || '')
    input?.onChange && input?.onChange(value)
    inputProps?.onChange && inputProps?.onChange(e)
    onChange && onChange(e)
  }, [])
  const handleTextChange = useCallback((e: any) => {
    handleChange(e.target.value, e)
  }, [])
  const handleColorChange = useCallback((color: any, e: any) => {
    handleChange(color.hex, e)
  }, [])

  return (
    <FormFieldGrid {...FormFieldGridProps}>
      <MuiTextField
        {...input}
        fullWidth
        error={!!invalid}
        helperText={invalid || ((meta.touched || validateOnMount) && meta.warning) || helperText || description}
        disabled={isDisabled}
        label={label}
        placeholder={placeholder}
        required={isRequired}
        inputProps={{
          readOnly: isReadOnly,
          ...inputProps,
        }}
        {...rest}
        onChange={handleTextChange}
        value={value}
      />
      <SketchPicker
        {...ColorPickerProps}
        color={value}
        onChangeComplete={handleColorChange}
      />
    </FormFieldGrid>
  )
}

ColorPickerComponent.defaultProps = {
  FormFieldGridProps: {},
  ColorPickerProps: {},
}

export {ColorPickerComponent}
export default ColorPickerComponent
