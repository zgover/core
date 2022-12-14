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

import { ICON_VARIANT_APP_SETTINGS } from '@aglyn/shared-data-enums'
import {
  FIELD_SCHEMA_FIRST_NAME,
  FIELD_SCHEMA_LAST_NAME,
  FIELD_SCHEMA_PASSWORD,
  FIELD_SCHEMA_PASSWORD_CONFIRM,
  FIELD_SCHEMA_PASSWORD_OLD,
} from '@aglyn/shared-data-forms'
import { Container, GridItems, useLoading } from '@aglyn/shared-ui-jsx'
import {
  FormRenderer,
  FormSchema,
  FormSpy,
  FormTemplateRenderProps,
  simpleComponentMapper,
  useFormApi,
} from '@aglyn/shared-ui-jsx-forms'
import { NextPageTitle, NextPageWithLayout } from '@aglyn/shared-ui-next'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Button, FormControl, Grid, Tab } from '@mui/material'
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { forwardRef, useCallback, useState } from 'react'
import { useAuth, useFirestore, useFirestoreDocData, useUser } from 'reactfire'
import AuthenticatedLayout from '../../../components/layouts/authenticated.layout'
import DashboardLayout from '../../../components/layouts/dashboard.layout'
import MainLayout from '../../../components/layouts/main.layout'
import WidgetCardComponent from '../../../components/widget-card.component'
import { buildRoute, Route } from '../../../constants/route-links'
import { CONTENT_MAX_WIDTH } from '../../../constants/shared'

const basicSchema: FormSchema = {
  fields: [FIELD_SCHEMA_FIRST_NAME, FIELD_SCHEMA_LAST_NAME],
}
const securitySchema: FormSchema = {
  fields: [
    FIELD_SCHEMA_PASSWORD_OLD,
    FIELD_SCHEMA_PASSWORD,
    FIELD_SCHEMA_PASSWORD_CONFIRM,
  ],
}

const FormTemplate = forwardRef<any, FormTemplateRenderProps>((props, ref) => {
  const { formFields, schema, ...rest } = props
  const { handleSubmit } = useFormApi()
  const isLoading = status === 'loading'
  return (
    <form ref={ref} onSubmit={handleSubmit} noValidate {...rest}>
      {schema.title}
      <Grid spacing={2} container>
        {formFields}
      </Grid>
      <FormSpy>
        {({ submitting, pristine, valid }) => (
          <Box mt={2}>
            <FormControl margin="normal" fullWidth>
              <Button
                color="secondary"
                disabled={submitting /* || !valid || pristine*/ || isLoading}
                style={{ marginRight: 8 }}
                type="submit"
                variant="contained"
                fullWidth
              >
                Save
              </Button>
            </FormControl>
          </Box>
        )}
      </FormSpy>
    </form>
  )
})

const Settings: NextPageWithLayout = (props) => {
  const [tab, setTab] = useState('1')
  const { data: user } = useUser()
  const userRef = doc(useFirestore(), 'users', user.uid)
  const { data } = useFirestoreDocData(userRef)
  const { enqueueSnackbar } = useSnackbar()
  const { queueLoading } = useLoading()
  const firebaseAuth = useAuth()

  const onTabChange = useCallback((e, value) => {
    setTab(value)
  }, [])

  const [fields, setFields] = useState({ ...data })
  const updateData = useCallback(
    async (fields: any) => {
      const dequeueLoading = queueLoading()
      await setDoc(userRef, { ...fields }, { merge: true })
        .then(() => {
          enqueueSnackbar('Saved!', { variant: 'success' })
        })
        .catch((e) => {
          enqueueSnackbar(`Error: ${JSON.stringify(e)}`, { variant: 'error' })
        })
        .finally(() => {
          dequeueLoading()
        })
    },
    [enqueueSnackbar, queueLoading, userRef],
  )

  const handleFieldChange = useCallback(
    (field: string) => (e) => {
      const target = e.currentTarget
      const value = target.value
      setFields((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const handleFieldBlur = useCallback(
    (field: string) => async (e) => {
      const target = e.currentTarget
      const value = target.value
      if (data[field] === value) return
      if (!value && target.required) {
        enqueueSnackbar(`Field is required`, { variant: 'warning' })
        return
      }
      await updateData({ [field]: value })
    },
    [data, updateData, enqueueSnackbar],
  )
  const handleBasicSave = useCallback(
    async (fields: any) => {
      const dequeueLoading = queueLoading()
      await setDoc(userRef, { ...fields }, { merge: true })
        .then(() => {
          enqueueSnackbar('Saved!', { variant: 'success' })
        })
        .catch((e) => {
          enqueueSnackbar(`Error: ${JSON.stringify(e)}`, { variant: 'error' })
        })
        .finally(() => {
          dequeueLoading()
        })
    },
    [enqueueSnackbar, queueLoading, userRef],
  )
  const handleSecuritySave = useCallback(
    async (fields: any) => {
      const dequeueLoading = queueLoading()
      await signInWithEmailAndPassword(
        firebaseAuth,
        user.email,
        fields[FIELD_SCHEMA_PASSWORD_OLD.name],
      )
        .then(() => {
          return updatePassword(user, fields[FIELD_SCHEMA_PASSWORD.name])
        })
        .catch((e) => {
          enqueueSnackbar(`Error: ${JSON.stringify(e)}`, { variant: 'error' })
        })
        .finally(() => {
          dequeueLoading()
        })
    },
    [enqueueSnackbar, queueLoading, userRef],
  )

  return (
    <>
      <NextPageTitle screen={'Settings'} />
      <DashboardLayout
        navTabItems={[
          {
            id: 'nav-tab-settings-user',
            label: 'User',
            href: buildRoute(Route.MANAGE_USER_SETTINGS),
          },
          {
            id: 'nav-tab-settings-account',
            label: 'Account',
            href: buildRoute(Route.MANAGE_ACCOUNT_SETTINGS),
          },
        ]}
        breadcrumbItems={[
          {
            children: 'Settings',
            href: buildRoute(Route.MANAGE_ACCOUNT_SETTINGS),
          },
        ]}
        header={{
          children: 'Account',
          icon: { path: ICON_VARIANT_APP_SETTINGS.path },
        }}
      >
        <Container gutterY maxWidth={CONTENT_MAX_WIDTH}>
          <TabContext value={tab}>
            <GridItems
              spacing={3}
              items={[
                {
                  xs: 12,
                  sm: 3,
                  children: (
                    <WidgetCardComponent header="Navigation">
                      <TabList
                        orientation="vertical"
                        textColor="secondary"
                        indicatorColor="secondary"
                        sx={{
                          ['.MuiTab-root']: {
                            alignItems: 'start',
                            maxWidth: 'unset',
                          },
                        }}
                        onChange={onTabChange}
                      >
                        <Tab label={'Basic info'} value={'1'} />
                        <Tab label={'Notifications'} value={'2'} />
                      </TabList>
                    </WidgetCardComponent>
                  ),
                },
                {
                  xs: 12,
                  sm: 9,
                  children: (
                    <>
                      <TabPanel sx={{ padding: 'unset' }} value={'1'}>
                        <WidgetCardComponent header="Basic info">
                          <Box sx={{ p: 2 }}>
                            <FormRenderer
                              FormTemplate={FormTemplate}
                              componentMapper={simpleComponentMapper}
                              onSubmit={handleBasicSave}
                              schema={basicSchema}
                              subscription={{ values: true }}
                              initialValues={data}
                            />
                          </Box>
                        </WidgetCardComponent>
                      </TabPanel>
                      <TabPanel sx={{ padding: 'unset' }} value={'2'}>
                        <WidgetCardComponent header="Security">
                          <Box sx={{ p: 2 }}>
                            <FormRenderer
                              FormTemplate={FormTemplate}
                              componentMapper={simpleComponentMapper}
                              onSubmit={handleSecuritySave}
                              schema={securitySchema}
                              subscription={{ values: true }}
                              initialValues={data}
                            />
                          </Box>
                        </WidgetCardComponent>
                      </TabPanel>
                    </>
                  ),
                },
              ]}
            />
          </TabContext>
        </Container>
      </DashboardLayout>
    </>
  )
}
Settings.displayName = 'Page:Settings'
Settings.layouts = [
  {
    Component: AuthenticatedLayout,
  },
  {
    Component: MainLayout,
    props: {
      title: 'User Settings',
    },
  },
]

export default Settings
