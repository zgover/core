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
'use client'

import type { ConsolePluginPageProps } from '@aglyn/aglyn'
import { GridItems } from '@aglyn/shared-ui-jsx'
import CampaignsCard from './campaigns-card'
import EmailScreensCard from './email-screens-card'
import ListsCard from './lists-card'

/**
 * Emails page (AGL-395): the console surface owned by the email plugin,
 * rendered by the shell's generic plugin route. Gathers the marketing
 * "Email" section (campaigns composer + audience lists) that used to live
 * on the Marketing page, plus a dedicated list of designed email screens
 * (which no longer clutter the main Screens list).
 */
export function EmailsConsolePage(props: ConsolePluginPageProps) {
  const { hostId } = props
  return (
    <GridItems
      spacing={3}
      items={[
        { size: { xs: 12 }, children: <EmailScreensCard hostId={hostId} /> },
        { size: { xs: 12 }, children: <CampaignsCard hostId={hostId} /> },
        { size: { xs: 12 }, children: <ListsCard hostId={hostId} /> },
      ]}
    />
  )
}
EmailsConsolePage.displayName = 'EmailsConsolePage'

export default EmailsConsolePage
