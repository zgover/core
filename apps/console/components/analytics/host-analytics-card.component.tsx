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
import {
  Box,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useFirestore } from 'reactfire'

const DAYS = 14

interface DayStat {
  day: string
  total: number
  paths: Record<string, number>
}

/**
 * Glanceable traffic panel (AGL-82): last 14 days of pageviews from the
 * per-day counter docs the tenant beacon writes, plus the top pages across
 * the window. Explicitly not a GA replacement.
 */
export function HostAnalyticsCard(props: { hostId: string }) {
  const { hostId } = props
  const firestore = useFirestore()
  const [days, setDays] = useState<DayStat[] | null>(null)

  useEffect(() => {
    let active = true
    const ids = Array.from({ length: DAYS }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (DAYS - 1 - index))
      return date.toISOString().slice(0, 10)
    })
    void Promise.all(
      ids.map((id) =>
        getDoc(doc(firestore, 'hosts', hostId, 'analytics', id))
          .then((snapshot) => ({
            day: id,
            total: Number(snapshot.get('total') ?? 0),
            paths: (snapshot.get('paths') ?? {}) as Record<string, number>,
          }))
          .catch(() => ({ day: id, total: 0, paths: {} })),
      ),
    ).then((stats) => {
      if (active) setDays(stats)
    })
    return () => {
      active = false
    }
  }, [firestore, hostId])

  const total = (days ?? []).reduce((sum, day) => sum + day.total, 0)
  const max = Math.max(1, ...(days ?? []).map((day) => day.total))
  const topPaths = Object.entries(
    (days ?? []).reduce<Record<string, number>>((acc, day) => {
      for (const [path, count] of Object.entries(day.paths)) {
        acc[path] = (acc[path] ?? 0) + count
      }
      return acc
    }, {}),
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <CardDisplay header={'Traffic (14 days)'} contentGutterX contentGutterY>
      {days === null ? (
        <LinearProgress />
      ) : total === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {'No pageviews recorded yet — stats appear as visitors browse ' +
            'your published site.'}
        </Typography>
      ) : (
        <Stack spacing={2}>
          <Typography variant="h4">{total.toLocaleString()}</Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ alignItems: 'flex-end', height: 64 }}
          >
            {days.map((day) => (
              <Tooltip key={day.day} title={`${day.day}: ${day.total}`}>
                <Box
                  sx={{
                    flex: 1,
                    height: `${Math.max(4, (day.total / max) * 100)}%`,
                    bgcolor: day.total ? 'secondary.main' : 'action.hover',
                    borderRadius: 0.5,
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
          {topPaths.length ? (
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">{'Top pages'}</Typography>
              {topPaths.map(([path, count]) => (
                <Stack
                  key={path}
                  direction="row"
                  sx={{ justifyContent: 'space-between' }}
                >
                  <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                    {path}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {count.toLocaleString()}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      )}
    </CardDisplay>
  )
}
HostAnalyticsCard.displayName = 'HostAnalyticsCard'

export default HostAnalyticsCard
