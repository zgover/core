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
  resolveDiscount,
  type HostDiscount,
} from './commerce-discounts'

const NOW = 1_800_000_000_000

const discounts: Array<HostDiscount & { $id: string }> = [
  { $id: 'save10', code: 'SAVE10', kind: 'percent', valuePct: 10 },
  {
    $id: 'summer',
    name: 'Summer sale',
    kind: 'percent',
    valuePct: 5,
  },
  {
    $id: 'bigspender',
    name: 'Free shipping over $50',
    kind: 'free_shipping',
    minSubtotalCents: 5000,
  },
  {
    $id: 'flat5',
    code: 'FLAT5',
    kind: 'fixed',
    valueCents: 500,
    productIds: ['p1'],
    maxRedemptions: 10,
    redemptions: 10,
  },
  {
    $id: 'expired',
    code: 'OLD',
    kind: 'percent',
    valuePct: 50,
    endAtMs: NOW - 1,
  },
]

describe('resolveDiscount', () => {
  const context = {
    subtotalCents: 10000,
    productIds: ['p1', 'p2'],
    nowMs: NOW,
  }

  it('applies a valid entered code (beats automatics)', () => {
    const resolved = resolveDiscount(discounts, { ...context, code: 'save10' })
    expect(resolved?.discountId).toBe('save10')
    expect(resolved?.discountCents).toBe(1000)
    expect(resolved?.codeProblem).toBeUndefined()
  })

  it('surfaces why an entered code fails', () => {
    expect(
      resolveDiscount(discounts, { ...context, code: 'FLAT5' })?.codeProblem,
    ).toMatch(/fully redeemed/)
    expect(
      resolveDiscount(discounts, { ...context, code: 'OLD' })?.codeProblem,
    ).toMatch(/expired/)
    expect(resolveDiscount(discounts, { ...context, code: 'NOPE' })).toBeNull()
  })

  it('picks the largest automatic discount without a code', () => {
    const resolved = resolveDiscount(discounts, context)
    expect(resolved?.discountId).toBe('summer')
    expect(resolved?.discountCents).toBe(500)
  })

  it('honors min-subtotal on automatics and grants free shipping', () => {
    const small = resolveDiscount(discounts, {
      subtotalCents: 1000,
      productIds: [],
      nowMs: NOW,
    })
    expect(small?.discountId).toBe('summer')
    // Free-shipping automatic qualifies at $50+ but percent still wins
    // on cents; free shipping surfaces when it is the best value.
    const onlyShipping = resolveDiscount(
      discounts.filter((discount) => discount.$id === 'bigspender'),
      context,
    )
    expect(onlyShipping?.freeShipping).toBe(true)
  })

  it('enforces product scope', () => {
    const scoped = resolveDiscount(
      [
        {
          $id: 'scoped',
          code: 'SCOPED',
          kind: 'percent',
          valuePct: 20,
          productIds: ['p9'],
        },
      ],
      { ...context, code: 'SCOPED' },
    )
    expect(scoped?.codeProblem).toMatch(/does not apply/)
  })
})
