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

import {getFirebaseAuth} from '@aglyn/shared-feature-fbclient'
import {AglynSvgIcon, AglynSvgLogo, AppLink, LoadingTextComponent} from '@aglyn/shared-ui-jsx'
import {Paper, Stack, Typography} from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import {signOut} from 'firebase/auth'
import {useEffect} from 'react'
import LayoutUnauthenticatedComponent from '../layouts/layout-unauthenticated.component'


const firebaseAuth = getFirebaseAuth()

function SignOut() {

  useEffect(() => {
    void signOut(firebaseAuth)
  }, [])

  return (
    <Stack
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={2}
      maxWidth={1}
      width={440}
    >
      <Paper
        variant="outlined"
        sx={{p: 2, width: 400}}
      >
        <Stack
          direction="column"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          marginBottom={4}
        >
          <Typography
            component="div"
            variant="body2"
            alignSelf="flex-end"
          >
            <AppLink href="/signup">
              {'Create account'}
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
            {'Signing out'}
          </Typography>
          <LoadingTextComponent
            component="div"
            variant="h6"
            align="center"
            sx={{pb: 4}}
          >
            {'Please wait'}
          </LoadingTextComponent>
          <CircularProgress color="secondary" />
        </Stack>
      </Paper>
    </Stack>
  )
}
SignOut.displayName = 'Page:SignOut'
SignOut.layoutComponent = LayoutUnauthenticatedComponent
SignOut.layoutProps = {
  LayoutUnauthenticatedComponent: {
    isSignOut: true,
  },
}

export default SignOut
