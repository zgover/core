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

import { isSlugReservationClaimable } from './organizations'

// AGL-585: a slug an org renamed AWAY from leaves a `movedTo` tombstone so
// old URLs redirect — but it must stay claimable by anyone. Only an ACTIVE
// reservation (no movedTo) held by another org blocks a claim.
describe('isSlugReservationClaimable (AGL-585)', () => {
  it('treats a missing reservation as free', () => {
    expect(isSlugReservationClaimable(undefined, 'org-b')).toBe(true)
    expect(isSlugReservationClaimable(undefined, null)).toBe(true)
  })

  it('blocks another org’s ACTIVE slug', () => {
    expect(
      isSlugReservationClaimable({ orgId: 'org-a' }, 'org-b'),
    ).toBe(false)
    // Creation flow (no claiming org yet) is blocked the same way.
    expect(isSlugReservationClaimable({ orgId: 'org-a' }, null)).toBe(false)
  })

  it('lets an org reclaim its own reservation (moving back)', () => {
    expect(
      isSlugReservationClaimable(
        { orgId: 'org-a', movedTo: 'new-slug' },
        'org-a',
      ),
    ).toBe(true)
    expect(isSlugReservationClaimable({ orgId: 'org-a' }, 'org-a')).toBe(true)
  })

  it('lets ANY org claim another org’s tombstone (the AGL-585 fix)', () => {
    // org-a renamed away (movedTo set): org-b may take the abandoned slug,
    // both on slug change and on org creation.
    expect(
      isSlugReservationClaimable(
        { orgId: 'org-a', movedTo: 'org-a-new' },
        'org-b',
      ),
    ).toBe(true)
    expect(
      isSlugReservationClaimable({ orgId: 'org-a', movedTo: 'org-a-new' }, null),
    ).toBe(true)
  })

  it('ignores empty/false movedTo values (still an active reservation)', () => {
    expect(
      isSlugReservationClaimable({ orgId: 'org-a', movedTo: '' }, 'org-b'),
    ).toBe(false)
    expect(
      isSlugReservationClaimable({ orgId: 'org-a', movedTo: null }, 'org-b'),
    ).toBe(false)
  })
})
