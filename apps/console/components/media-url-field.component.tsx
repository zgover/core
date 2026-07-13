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

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { collection, limit, query } from 'firebase/firestore'
import { useState } from 'react'
import { useFirestore } from '@aglyn/tenant-feature-instance'
import useFirestoreCollection from '../hooks/use-firestore-collection'

export interface MediaUrlFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  /** Org whose media library backs the browser. When absent, only manual
   * URL entry is offered. */
  orgId?: string | null
  helperText?: string
  placeholder?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
}

/**
 * Image URL field with a media-library browser (AGL-393): a text field
 * for manual URLs (the escape hatch) plus a "Browse" button that opens
 * the org's image library. Used for logos and avatars where the besigner
 * media picker isn't in scope.
 */
export function MediaUrlField(props: MediaUrlFieldProps) {
  const {
    label,
    value,
    onChange,
    orgId,
    helperText,
    placeholder = 'https://…',
    fullWidth = true,
    size = 'small',
  } = props
  const [browsing, setBrowsing] = useState(false)
  const firestore = useFirestore()
  const { data: mediaDocs } = useFirestoreCollection<any>(
    () =>
      query(
        collection(firestore, 'orgs', orgId ?? '-pending-', 'media'),
        limit(200),
      ),
    [firestore, orgId],
    { idField: '$id' },
  )
  const images = (mediaDocs ?? []).filter((item: any) =>
    String(item.contentType ?? '').startsWith('image/'),
  )

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          helperText={helperText}
          size={size}
          fullWidth={fullWidth}
        />
        {orgId ? (
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 0.5, flexShrink: 0 }}
            onClick={() => setBrowsing(true)}
          >
            {'Browse'}
          </Button>
        ) : null}
      </Stack>
      <Dialog
        open={browsing}
        onClose={() => setBrowsing(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{'Choose an image'}</DialogTitle>
        <DialogContent>
          {images.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {'No images in the organization media library yet — upload ' +
                'some on the Media page, or paste a URL instead.'}
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                gap: 1,
              }}
            >
              {images.map((item: any) => (
                <Tooltip key={item.$id} title={item.fileName ?? ''}>
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.fileName ?? ''}
                    onClick={() => {
                      onChange(item.url)
                      setBrowsing(false)
                    }}
                    sx={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { borderColor: 'secondary.main' },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrowsing(false)}>{'Close'}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
MediaUrlField.displayName = 'MediaUrlField'

export default MediaUrlField
