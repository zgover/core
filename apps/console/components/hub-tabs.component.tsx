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

import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Tab } from '@mui/material'
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'
import { type ReactNode, type SyntheticEvent, useCallback, useState } from 'react'

export interface HubTab {
  id: string
  label: string
  content: ReactNode
}

export interface HubTabsProps {
  tabs: HubTab[]
}

/**
 * Hub tab strip (AGL-354/355/356): the host-setup tab pattern as a
 * shared component. The active tab mirrors into the `?tab=` query param
 * (shallow replace) so hub views deep-link and survive back/forward.
 */
export function HubTabs(props: HubTabsProps) {
  const { tabs } = props
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedTab = searchParams?.get('tab')
  const [tab, setTab] = useState(
    tabs.some((item) => item.id === requestedTab)
      ? (requestedTab as string)
      : (tabs[0]?.id ?? ''),
  )

  const handleChange = useCallback(
    (event: SyntheticEvent, value: string) => {
      setTab(value)
      void router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: value },
        },
        undefined,
        { shallow: true },
      )
    },
    [router],
  )

  return (
    <TabContext value={tab}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <TabList
          onChange={handleChange}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {tabs.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} />
          ))}
        </TabList>
      </Box>
      {tabs.map((item) => (
        <TabPanel key={item.id} value={item.id} sx={{ px: 0 }}>
          {item.content}
        </TabPanel>
      ))}
    </TabContext>
  )
}
HubTabs.displayName = 'HubTabs'

export default HubTabs
