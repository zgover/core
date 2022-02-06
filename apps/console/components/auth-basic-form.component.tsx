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

import {FormSpy, useFormApi} from '@aglyn/shared-ui-jsx'
import {type FormTemplateRenderProps} from '@data-driven-forms/react-form-renderer'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import {forwardRef} from 'react'


const AuthBasicFormComponent = forwardRef<any, FormTemplateRenderProps>(
  function RefRenderFn(props, ref) {
    const {formFields, schema, ...rest} = props
    const {handleSubmit} = useFormApi()
    return (
      <form ref={ref} onSubmit={handleSubmit} noValidate {...rest}>
        {schema.title}
        <Grid spacing={2} container>
          {formFields}
        </Grid>
        <FormSpy>
          {({submitting, pristine, valid}) => (
            <Box mt={2}>
              <FormControl margin="normal" fullWidth>
                <Button
                  color="secondary"
                  disabled={submitting/* || !valid || pristine*/}
                  style={{marginRight: 8}}
                  type="submit"
                  variant="contained"
                  fullWidth
                >
                  Next
                </Button>
              </FormControl>
            </Box>
          )}
        </FormSpy>
      </form>
    )
  },
)
AuthBasicFormComponent.displayName = 'AuthBasicFormComponent'

export {AuthBasicFormComponent}
export default AuthBasicFormComponent
