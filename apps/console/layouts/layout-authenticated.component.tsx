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
import {AglynSvgLogo, LoadingLayoutComponent, useLoading} from '@aglyn/shared-ui-jsx'
import {useContinueQueryEncoded} from '@aglyn/shared-util-next'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {useRouter} from 'next/router'
import {type ReactNode, useEffect} from 'react'
import {useAuthState} from 'react-firebase-hooks/auth'


const firebaseAuth = getFirebaseAuth()

export interface LayoutAuthenticatedComponentProps {
  children?: ReactNode
}

function LayoutAuthenticatedComponent(props: LayoutAuthenticatedComponentProps) {
  const {children, ...rest} = props
  const [user, authLoading, error] = useAuthState(firebaseAuth)
  const {queueLoading} = useLoading()
  const router = useRouter()
  const continueRoute = useContinueQueryEncoded()

  useEffect(() => {
    // const dequeueLoading = authLoading ? queueLoading() : null
    return () => {
      // dequeueLoading && dequeueLoading()
    }
  }, [authLoading, queueLoading])

  useEffect(() => {
    console.log('loc', location)
    console.log('base64', continueRoute)
    if (!user && !authLoading) {
      const dequeueLoading = queueLoading()
      router
        .push(`/signin?continue=${continueRoute}`)
        .finally(() => {
          dequeueLoading && dequeueLoading()
        })
    }
  }, [user, authLoading, continueRoute])


  return (
    <>
      {authLoading || !user ? (
        <Stack
          component="div"
          direction="column"
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{
            width: `100vw`,
            height: `100vh`,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <AglynSvgLogo sx={{width: 280, maxWidth: 1}} color="secondary" />
          <CircularProgress color="secondary" />
          <Typography
            component="div"
            variant="overline"
            sx={{mt: 2, fontWeight: 'fontWeightBold'}}
          >
            {'One moment...'}
          </Typography>
        </Stack>
      ) : (
        <>
          {children}
        </>
      )}
    </>
  )
}
LayoutAuthenticatedComponent.displayName = 'LayoutAuthenticatedComponent'
LayoutAuthenticatedComponent.layoutComponent = LoadingLayoutComponent

export {LayoutAuthenticatedComponent}
export default LayoutAuthenticatedComponent
