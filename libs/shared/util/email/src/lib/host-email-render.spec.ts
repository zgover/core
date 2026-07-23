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

import {
  loadHostEmail,
  renderHostEmail,
  renderLoadedHostEmail,
  type AdminFirestoreLike,
} from './host-email-render'

/** A Firestore-ish snapshot over a plain object. */
function snapshot(data: Record<string, unknown> | null) {
  return { exists: data !== null, get: (field: string) => data?.[field] }
}

/**
 * A fake Admin Firestore modelling the exact chain the resolver walks:
 * hosts/{id}/emailTemplates/{key} then that ref's versions/{versionId}.
 * `reads` counts template-doc gets so a test can prove resolve-once.
 */
function fakeFirestore(
  template: Record<string, unknown> | null,
  version: Record<string, unknown> | null,
  reads: { templates: number; versions: number },
): AdminFirestoreLike {
  const templateRef = {
    get: async () => {
      reads.templates += 1
      return snapshot(template)
    },
    collection: () => ({
      doc: () => ({
        get: async () => {
          reads.versions += 1
          return snapshot(version)
        },
        collection: () => ({ doc: () => ({ get: async () => snapshot(null) }) }),
      }),
    }),
  }
  return {
    collection: () => ({
      doc: () => ({
        get: async () => snapshot(null),
        collection: () => ({ doc: () => templateRef }),
      }),
    }),
  } as unknown as AdminFirestoreLike
}

const NODES = {
  '_@_': { $id: '_@_', componentId: 'div', nodes: ['t1'] },
  t1: {
    $id: 't1',
    componentId: 'emailText',
    pluginId: 'email',
    parentId: '_@_',
    props: { children: 'Hi {{name}}', variant: 'body' },
  },
}

describe('renderHostEmail (AGL-770)', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined))

  it('returns null for an unknown key without reading Firestore', async () => {
    const reads = { templates: 0, versions: 0 }
    const fs = fakeFirestore(null, null, reads)
    expect(await renderHostEmail(fs, 'h1', 'not-a-real-email')).toBeNull()
    expect(reads.templates).toBe(0)
  })

  it('returns null for a non-designable (fixed/external) key without reading', async () => {
    const reads = { templates: 0, versions: 0 }
    const fs = fakeFirestore(null, null, reads)
    // order-receipt is `fixed`, campaign is `external` — neither is besigner.
    expect(await renderHostEmail(fs, 'h1', 'order-receipt')).toBeNull()
    expect(await renderHostEmail(fs, 'h1', 'campaign')).toBeNull()
    expect(reads.templates).toBe(0)
  })

  it('falls back (null) when no version is published', async () => {
    const reads = { templates: 0, versions: 0 }
    const fs = fakeFirestore({ versionId: null }, null, reads)
    expect(await renderHostEmail(fs, 'h1', 'booking-confirmed')).toBeNull()
  })

  it('renders a published designable template', async () => {
    const reads = { templates: 0, versions: 0 }
    const fs = fakeFirestore(
      { versionId: 'v1', subject: 'See you {{name}}' },
      { nodes: NODES },
      reads,
    )
    const result = await renderHostEmail(fs, 'h1', 'booking-confirmed', {
      name: 'Alex',
    })
    expect(result?.subject).toBe('See you Alex')
    expect(result?.html).toContain('Hi Alex')
  })

  it('loads once, then renders per recipient with no more reads', async () => {
    const reads = { templates: 0, versions: 0 }
    const fs = fakeFirestore(
      { versionId: 'v1', subject: 'Hello {{name}}' },
      { nodes: NODES },
      reads,
    )
    const loaded = await loadHostEmail(fs, 'h1', 'booking-reminder')
    expect(loaded).not.toBeNull()
    expect(reads.templates).toBe(1)
    expect(reads.versions).toBe(1)

    const a = renderLoadedHostEmail(loaded!, { name: 'Alex' })
    const b = renderLoadedHostEmail(loaded!, { name: 'Sam' })
    expect(a?.subject).toBe('Hello Alex')
    expect(b?.subject).toBe('Hello Sam')
    // Rendering touched Firestore no further.
    expect(reads.templates).toBe(1)
    expect(reads.versions).toBe(1)
  })

  it('never leaves an unresolved token in the output', async () => {
    const reads = { templates: 0, versions: 0 }
    const fs = fakeFirestore(
      { versionId: 'v1', subject: 'Hi {{name}}' },
      { nodes: NODES },
      reads,
    )
    const result = await renderHostEmail(fs, 'h1', 'booking-confirmed', {})
    expect(result?.subject).not.toContain('{{')
    expect(result?.html).not.toContain('{{')
  })
})
