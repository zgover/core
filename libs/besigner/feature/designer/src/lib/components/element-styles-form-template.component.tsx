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

import {
  FormSpy,
  type FormTemplateRenderProps,
  useFormApi,
} from '@aglyn/shared-ui-jsx-forms'
import { Grid } from '@mui/material'
import { forwardRef, memo, useEffect, useRef } from 'react'
import { useDebouncedCommit } from './element-props-form.component'

// Subscribes to form value changes via FormSpy and schedules a debounced
// commit when dirty. The spy is needed because MUI Select uses a Portal, so
// its onChange never bubbles through the <form> element as a DOM event.
const AutoApplyOnChange = memo(function AutoApplyOnChange({
  values,
  pristine,
  valid,
  onSchedule,
}: {
  values: unknown
  pristine: boolean
  valid: boolean
  onSchedule: () => void
}) {
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!pristine && valid) {
      onSchedule()
    }
  }, [values]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
})

/**
 * Immediate-apply form template for the styles panel (AGL-587): style
 * edits commit on a short debounce with no "Save Element" button, so
 * every control in the panel shares one interaction model with the
 * toggle accordions and the BoxStyler. Focus leaving a field flushes
 * the pending commit, matching the attributes form's behavior
 * (AGL-567); teardown flushes too, so the last edit is never dropped.
 */
export const ElementStylesFormTemplate = forwardRef<
  any,
  FormTemplateRenderProps
>((props, ref) => {
  const { formFields, schema, ...rest } = props
  const { handleSubmit } = useFormApi()
  const { schedule, flush } = useDebouncedCommit(handleSubmit)
  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      noValidate
      {...rest}
      // Placed after {...rest} so this handler always wins.
      onBlur={flush}
    >
      {schema.title}
      <Grid spacing={2} container>
        {formFields as unknown as JSX.Node}
      </Grid>
      <FormSpy subscription={{ values: true, pristine: true, valid: true }}>
        {({ values, pristine, valid }) => (
          <AutoApplyOnChange
            values={values}
            pristine={pristine}
            valid={valid}
            onSchedule={schedule}
          />
        )}
      </FormSpy>
    </form>
  )
})
ElementStylesFormTemplate.displayName = 'ElementStylesFormTemplate'
ElementStylesFormTemplate.aglyn = true

export default ElementStylesFormTemplate
