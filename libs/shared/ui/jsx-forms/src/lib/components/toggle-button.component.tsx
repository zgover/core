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
import {useFieldApi, type UseFieldApiConfig} from '@data-driven-forms/react-form-renderer'
import {
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
  type ToggleButtonProps as MuiToggleButtonProps,
} from '@mui/material'


export type ToggleButtonProps = UseFieldApiConfig & {
  ToggleButtonProps?: Partial<MuiToggleButtonProps>
  ToggleButtonGroupProps?: Partial<ToggleButtonGroupProps>
}

export const ToggleButtonComponent = (props: ToggleButtonProps) => {
  const {
    input,
    isReadOnly,
    isDisabled,
    isRequired,
    label,
    helperText,
    description,
    validateOnMount,
    meta,
    FormFieldGridProps,
    FormControlProps,
    FormGroupProps,
    FormControlLabelProps,
    ToggleButtonProps,
    ToggleButtonGroupProps,
    FormLabelProps,
    FormHelperTextProps,
    inputProps,
    options,
    ...rest
  } = useFieldApi({
    ...props,
    type: 'checkbox',
  })
  const invalid = validationError(meta, validateOnMount)
  const hasError = Boolean(invalid)
  const text = invalid || ((meta.touched || validateOnMount) && meta.warning) || helperText || description
  return (
    <FormFieldGrid {...FormFieldGridProps}>
      <FormControl
        required={isRequired}
        error={hasError}
        component="fieldset"
        {...FormControlProps}
      >
        <FormGroup {...FormGroupProps}>
          <FormControlLabel
            {...FormControlLabelProps}
            control={
              <ToggleButtonGroup
                color="primary"
                {...input}
                {...ToggleButtonGroupProps}
                disabled={isDisabled || isReadOnly}
                value={input.value}
                exclusive
                {...rest}
              >
                {Array.isArray(options) && options.map(({value, label, children, ...option}) => (
                  <ToggleButton
                    {...ToggleButtonProps}
                    key={value || label || children}
                    children={children || label || value}
                    value={value || label || children}
                    {...option}
                  />
                ))}
              </ToggleButtonGroup>
            }
            disabled={isDisabled || isReadOnly}
            label={<FormLabel {...FormLabelProps}>{label}</FormLabel>}
          />
          {text && <FormHelperText {...FormHelperTextProps}>{text}</FormHelperText>}
        </FormGroup>
      </FormControl>
    </FormFieldGrid>
  )
}

ToggleButtonComponent.defaultProps = {
  FormFieldGridProps: {},
  FormControlProps: {},
  FormGroupProps: {},
  FormControlLabelProps: {},
  ToggleButtonProps: {},
  ToggleButtonGroupProps: {},
  FormLabelProps: {},
  FormHelperTextProps: {},
}

export default ToggleButtonComponent
