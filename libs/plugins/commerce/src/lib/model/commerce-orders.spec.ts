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
  appendOrderEvent,
  canTransitionOrder,
  computeOrderTotals,
  formatOrderNumber,
  liftLegacyOrder,
} from './commerce-orders'

describe('canTransitionOrder', () => {
  it('allows the documented lifecycle and blocks the rest', () => {
    expect(canTransitionOrder('pending', 'paid')).toBe(true)
    expect(canTransitionOrder('paid', 'fulfilled')).toBe(true)
    expect(canTransitionOrder('paid', 'partially_fulfilled')).toBe(true)
    expect(canTransitionOrder('fulfilled', 'delivered')).toBe(true)
    expect(canTransitionOrder('fulfilled', 'refunded')).toBe(true)
    // Shipped orders refund, they don't cancel.
    expect(canTransitionOrder('fulfilled', 'cancelled')).toBe(false)
    expect(canTransitionOrder('refunded', 'paid')).toBe(false)
    expect(canTransitionOrder('cancelled', 'paid')).toBe(false)
  })
})

describe('computeOrderTotals', () => {
  const lines = [
    { productId: 'a', name: 'Pads', quantity: 2, unitAmountCents: 2500 },
    { productId: 'b', name: 'Levers', quantity: 1, unitAmountCents: 4000 },
  ]
  it('sums items and folds in the parts', () => {
    const totals = computeOrderTotals(lines, {
      shippingCents: 799,
      taxCents: 450,
      discountCents: 1000,
      feeCents: 180,
    })
    expect(totals.itemsCents).toBe(9000)
    expect(totals.totalCents).toBe(9000 + 799 + 450 - 1000)
    expect(totals.feeCents).toBe(180)
  })
  it('clamps discounts to items + shipping', () => {
    const totals = computeOrderTotals(lines, { discountCents: 99999 })
    expect(totals.discountCents).toBe(9000)
    expect(totals.totalCents).toBe(0)
  })
})

describe('formatOrderNumber', () => {
  it('prefers the sequence, falls back to the doc id', () => {
    expect(formatOrderNumber({ number: 1042 })).toBe('#1042')
    expect(formatOrderNumber({}, 'cs_test_abcdef')).toBe('#ABCDEF')
    expect(formatOrderNumber({})).toBe('#—')
  })
})

describe('liftLegacyOrder', () => {
  it('lifts flat Commerce Starter rows', () => {
    const lifted = liftLegacyOrder({
      productId: 'p1',
      amountCents: 2500,
      feeCents: 50,
    })
    expect(lifted.status).toBe('paid')
    expect(lifted.lineItems).toHaveLength(1)
    expect(lifted.totals?.totalCents).toBe(2500)
    expect(lifted.totals?.feeCents).toBe(50)
  })
  it('passes shaped orders through', () => {
    const shaped = {
      status: 'fulfilled' as const,
      lineItems: [
        { productId: 'x', name: 'X', quantity: 1, unitAmountCents: 100 },
      ],
    }
    expect(liftLegacyOrder(shaped).status).toBe('fulfilled')
  })
})

describe('appendOrderEvent', () => {
  it('appends immutably with a timestamp', () => {
    const order = { timeline: [{ atMs: 1, event: 'paid' }] }
    const next = appendOrderEvent(order, 'fulfilled', 'Sent via UPS', 2)
    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({
      atMs: 2,
      event: 'fulfilled',
      detail: 'Sent via UPS',
    })
    expect(order.timeline).toHaveLength(1)
  })
})
