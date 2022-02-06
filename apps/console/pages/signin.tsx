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

import {FIELD_SCHEMA_EMAIL, FIELD_SCHEMA_PASSWORD} from '@aglyn/shared-data-fields'
import {
  AglynSvgIcon,
  AglynSvgLogo,
  AppLink,
  BackgroundImageComponent,
  componentMapper,
  FormRenderer,
  FormSpy,
  useFormApi,
} from '@aglyn/shared-ui-jsx'
import {type FormTemplateRenderProps} from '@data-driven-forms/react-form-renderer'
import type FormSchema from '@data-driven-forms/react-form-renderer/common-types/schema'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {forwardRef, useCallback, useState} from 'react'


const FormTemplate = forwardRef<any, FormTemplateRenderProps>(
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
                  disabled={submitting || !valid || pristine}
                  style={{marginRight: 8}}
                  type="submit"
                  variant="contained"
                  fullWidth
                >
                  Proceed
                </Button>
              </FormControl>
            </Box>
          )}
        </FormSpy>
      </form>
    )
  },
)
FormTemplate.displayName = 'FormTemplate'

const formSchema: FormSchema = {
  'fields': [
    FIELD_SCHEMA_EMAIL,
    FIELD_SCHEMA_PASSWORD,
  ],
}
const defaultValues = {username: '', password: ''}

function Signin() {

  const [values, setValues] = useState(defaultValues)
  const handleFormCancel = useCallback(() => {
    setValues(defaultValues)
  }, [])
  const handleFormSubmit = useCallback((values) => {
    setValues({...values})
  }, [])

  return (
    <BackgroundImageComponent
      url="/_static/images/backgrounds/patterns/abstract-wave-lines.svg"
      sx={{
        minHeight: '100vh',
        bgcolor: 'primary.dark',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: [2, 3],
      }}
    >

      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >

        <Paper
          elevation={1}
          sx={{
            p: 2,
            zIndex: 5,
          }}
        >

          <Stack
            direction="column"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{mb: 4}}
          >

            <Typography
              component="div"
              variant="body2"
              alignSelf="flex-end"
            >
              <AppLink
                href="/signup"
              >
                {'Create account'}
              </AppLink>
            </Typography>

            <Stack
              direction="row"
              justifyContent="center"
              alignItems="flex-start"
              spacing={1}
              sx={{pb: 3}}
            >
              <AglynSvgIcon rounded bordered edge="start" sx={{fontSize: 32}} />
              <AglynSvgLogo sx={{fontSize: 86}} />
            </Stack>


            <Typography
              component="h1"
              variant="h3"
            >
              {'Sign in '}
            </Typography>

            <Typography
              component="div"
              variant="h6"
            >
              {'Using your Email and Password'}
            </Typography>
          </Stack>

          <FormRenderer
            FormTemplate={FormTemplate}
            componentMapper={componentMapper}
            onCancel={handleFormCancel}
            onReset={handleFormCancel}
            onSubmit={handleFormSubmit}
            initialValues={values}
            schema={formSchema}
            subscription={{values: true}}
            clearOnUnmount
          />

          <Stack
            direction="column"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{mt: 2}}
          >
            <Typography
              component="div"
              variant="body2"
            >
              {'Having trouble logging in? '}
              <AppLink
                href="account-recovery"
              >
                Account recovery
              </AppLink>
            </Typography>
          </Stack>

        </Paper>

      </Stack>

    </BackgroundImageComponent>
  )
}
Signin.displayName = 'Page:Signin'

export default Signin
