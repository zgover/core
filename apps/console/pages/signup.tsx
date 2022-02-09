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

import {
  FIELD_SCHEMA_EMAIL,
  FIELD_SCHEMA_FIRST_NAME,
  FIELD_SCHEMA_LAST_NAME,
  FIELD_SCHEMA_PASSWORD,
  FIELD_SCHEMA_PASSWORD_CONFIRM,
} from '@aglyn/shared-data-fields'
import {
  AglynSvgIcon,
  AglynSvgLogo,
  AppLink,
  componentMapper,
  FormRenderer,
} from '@aglyn/shared-ui-jsx'
import {mdiGoogle, MdiIcon} from '@aglyn/shared-ui-mdi-jsx'
import type FormSchema from '@data-driven-forms/react-form-renderer/common-types/schema'
import {Divider} from '@mui/material'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {useCallback, useState} from 'react'
import AuthBaseComponent from '../components/auth-base.component'
import AuthBasicFormComponent from '../components/auth-basic-form.component'


const formSchema: FormSchema = {
  'fields': [
    FIELD_SCHEMA_FIRST_NAME,
    FIELD_SCHEMA_LAST_NAME,
    FIELD_SCHEMA_EMAIL,
    FIELD_SCHEMA_PASSWORD,
    FIELD_SCHEMA_PASSWORD_CONFIRM,
  ],
}
const defaultValues = {firstName: '', lastName: '', email: '', password: '', confirmPasswd: ''}

function Signup() {

  const [values, setValues] = useState(defaultValues)
  const handleFormCancel = useCallback(() => {
    setValues(defaultValues)
  }, [])
  const handleFormSubmit = useCallback((values) => {
    setValues({...values})
  }, [])

  return (
    <>

      <Paper
        elevation={1}
        sx={{
          p: 2,
          zIndex: 5,
          width: 440,
          maxWidth: 1,
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
              href="/signin"
            >
              {'Sign in'}
            </AppLink>
          </Typography>

          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{pb: 3}}
          >
            <AglynSvgIcon rounded bordered sx={{fontSize: 24}} />
            <AglynSvgLogo sx={{fontSize: 64, transform: `translateY(0.12rem)`}} />
          </Stack>


          <Typography
            component="h1"
            variant="h4"
          >
            {'Sign up'}
          </Typography>

          <Typography
            component="div"
            variant="h6"
          >
            {'Create a new Aglyn Account'}
          </Typography>
        </Stack>

        <FormRenderer
          FormTemplate={AuthBasicFormComponent}
          componentMapper={componentMapper}
          onCancel={handleFormCancel}
          onReset={handleFormCancel}
          onSubmit={handleFormSubmit}
          initialValues={values}
          schema={formSchema}
          subscription={{values: true}}

          clearOnUnmount
        />

        <Divider flexItem sx={{my: 1}}>
          {'Or'}
        </Divider>

        <Stack
          direction="column"
          justifyContent="center"
          alignItems="stretch"
          spacing={1}
        >

          <Button
            startIcon={<MdiIcon path={mdiGoogle.path} />}
          >
            {'Sign up with Google'}
          </Button>

        </Stack>

      </Paper>

      <Typography
        component="div"
        variant="body2"
        color=""
      >
        {'Already have an account? '}
        <AppLink
          href="/signin"
        >
          Sign in
        </AppLink>
      </Typography>


    </>
  )
}
Signup.displayName = 'Page:Signup'
Signup.getLayout = (children) => <AuthBaseComponent children={children} />

export default Signup
