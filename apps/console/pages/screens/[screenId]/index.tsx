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

import {ICON_VARIANT_PAGES} from '@aglyn/shared-data-enums'
import {Container} from '@mui/material'
import {doc} from 'firebase/firestore'
import {useRouter} from 'next/router'
import {useFirestore, useFirestoreDocDataOnce} from 'reactfire'
import WidgetCardComponent from '../../../components/widget-card.component'
import {CONTENT_MAX_WIDTH} from '../../../constants/shared'
import LayoutConsoleComponent from '../../../layouts/layout-console.component'
import LayoutDashboardComponent from '../../../layouts/layout-dashboard.component'


export function ScreenDetails(props) {

  const {query} = useRouter()
  const screenId = query.screenId as string
  const firestore = useFirestore()
  const screenRef = doc(firestore, 'screens', `${screenId}`)
  const {status, data: screen} = useFirestoreDocDataOnce(screenRef, {
    idField: '$id', // this field will be added to the object created from each document
  })

  console.log('Screens props', props, status, screen)

  return (
    <LayoutDashboardComponent
      breadcrumbItems={[
        {
          children: 'Screens',
          href: '/screens',
        },
        {
          children: `${screen?.displayName || 'Not Found'}`,
        },
      ]}
      header={{
        children: 'Screen Details',
        icon: {path: ICON_VARIANT_PAGES.path},
      }}
    >
      <Container sx={{py: 3}} maxWidth={CONTENT_MAX_WIDTH}>

        <WidgetCardComponent>
          {JSON.stringify(screen, null, 2)}
        </WidgetCardComponent>

      </Container>
    </LayoutDashboardComponent>
  )
}
ScreenDetails.displayName = 'Page:ScreenDetails'
ScreenDetails.layoutComponent = LayoutConsoleComponent
ScreenDetails.layoutProps = {
  LayoutConsoleComponent: {
    title: 'Screen Details',
    disableAppBarElevation: true,
  },
}

export default ScreenDetails
