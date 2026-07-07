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

import { CardDisplay } from '@aglyn/shared-ui-jsx'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import { MenuItem, TextField, Typography } from '@mui/material'
import {
  collection,
  deleteField,
  doc,
  limit,
  query,
  updateDoc,
} from 'firebase/firestore'
import { useCallback } from 'react'
import {
  useFirestore,
  useFirestoreCollectionData,
  useFirestoreDocData,
} from 'reactfire'

export interface NotFoundScreenCardProps {
  hostId: string
}

/**
 * Custom not-found screen binding (AGL-87): unmatched paths on the tenant
 * site render the chosen screen (noindex) instead of the bare 404.
 */
export function NotFoundScreenCard(props: NotFoundScreenCardProps) {
  const { hostId } = props
  const firestore = useFirestore()
  const { enqueueSnackbar } = useSnackbar()
  const { data: host } = useFirestoreDocData<any>(
    doc(firestore, 'hosts', hostId),
    { idField: '$id' },
  )
  const { data: screenDocs } = useFirestoreCollectionData<any>(
    query(collection(firestore, 'hosts', hostId, 'screens'), limit(200)),
    { idField: '$id' },
  )
  const screens = [...(screenDocs ?? [])]
    .filter((screen: any) => !screen.deletedAt)
    .sort((a: any, b: any) =>
      String(a.displayName ?? '').localeCompare(String(b.displayName ?? '')),
    )

  const handleChange = useCallback(
    async (value: string) => {
      await updateDoc(doc(firestore, 'hosts', hostId), {
        notFoundScreenId: value || deleteField(),
      })
      enqueueSnackbar(
        value ? 'Custom error page set' : 'Custom error page cleared',
        { variant: 'success', persist: false },
      )
    },
    [firestore, hostId, enqueueSnackbar],
  )

  return (
    <CardDisplay header="Error page" contentGutterX contentGutterY>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {'Visitors hitting a missing address see this screen instead of a ' +
          'blank 404 (search engines are told not to index it).'}
      </Typography>
      <TextField
        select
        size="small"
        label="Not-found screen"
        value={host?.notFoundScreenId ?? ''}
        onChange={(event) => void handleChange(event.target.value)}
        sx={{ minWidth: 280 }}
      >
        <MenuItem value="">{'Default 404'}</MenuItem>
        {screens.map((screen: any) => (
          <MenuItem key={screen.$id} value={screen.$id}>
            {screen.displayName ?? screen.$id}
          </MenuItem>
        ))}
      </TextField>
    </CardDisplay>
  )
}
NotFoundScreenCard.displayName = 'NotFoundScreenCard'

export default NotFoundScreenCard
