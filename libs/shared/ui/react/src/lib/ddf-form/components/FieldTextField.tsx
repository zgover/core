import { forwardRef, ReactNode } from 'react'

import MuiTextField, { TextFieldProps as MuiTextFieldProps } from '@material-ui/core/TextField'

import useFieldApi, { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api'

import { withGridItem } from '../field-hocs'
import { validationMessage } from '../utils'


export type Props = MuiTextFieldProps & UseFieldApiConfig & {
  isReadOnly?: boolean
  isDisabled?: boolean
  isRequired?: boolean
  description?: ReactNode
  validateOnMount?: boolean
}


const FieldSelect = forwardRef<any, Props>(
  function  RefRenderFn(props, ref) {
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
      ...rest
    } = useFieldApi(props)
    const invalidMessage = validationMessage(meta, validateOnMount)
    const helpText = invalidMessage || ((meta.touched || validateOnMount) && meta.warning) || helperText || description

    return (
      <MuiTextField
        ref={ref}
        {...input}
        disabled={isDisabled}
        error={Boolean(invalidMessage)}
        helperText={helpText}
        inputProps={{ readOnly: isReadOnly, ...inputProps }}
        label={label}
        placeholder={placeholder}
        required={isRequired}
        fullWidth
        {...rest}
      />
    )
  }
)

FieldSelect.displayName = 'FieldSelect'

export default withGridItem(FieldSelect)