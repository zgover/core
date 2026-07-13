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
  resolveShippingRates,
  type ShippingSettings,
} from './commerce-shipping'

const settings: ShippingSettings = {
  zones: [
    { id: 'us', name: 'United States', countries: ['US'] },
    { id: 'world', name: 'Everywhere else', countries: ['*'] },
  ],
  rates: [
    { id: 'std', zoneId: 'us', name: 'Standard', kind: 'flat', amountCents: 799 },
    {
      id: 'free50',
      zoneId: 'us',
      name: 'Free over $50',
      kind: 'free_over',
      amountCents: 799,
      freeOverCents: 5000,
    },
    {
      id: 'wt',
      zoneId: 'us',
      name: 'By weight',
      kind: 'weight_tiers',
      tiers: [
        { upTo: 500, amountCents: 599 },
        { upTo: 2000, amountCents: 1299 },
      ],
    },
    {
      id: 'intl',
      zoneId: 'world',
      name: 'International',
      kind: 'price_tiers',
      tiers: [{ upTo: 100000, amountCents: 2999 }],
    },
  ],
}

describe('resolveShippingRates', () => {
  it('matches specific zones and hides rest-of-world for them', () => {
    const rates = resolveShippingRates(settings, 'US', {
      subtotalCents: 2000,
      totalGrams: 400,
    })
    expect(rates.map((rate) => rate.rateId)).toEqual(['wt', 'std', 'free50'])
    expect(rates.find((rate) => rate.rateId === 'wt')?.amountCents).toBe(599)
  })

  it('falls back to the rest-of-world zone', () => {
    const rates = resolveShippingRates(settings, 'FR', {
      subtotalCents: 2000,
    })
    expect(rates.map((rate) => rate.rateId)).toEqual(['intl'])
  })

  it('zeroes free_over rates past the threshold, sorts cheapest first', () => {
    const rates = resolveShippingRates(settings, 'US', {
      subtotalCents: 6000,
      totalGrams: 400,
    })
    expect(rates[0]).toMatchObject({ rateId: 'free50', amountCents: 0 })
  })

  it('drops tiered rates beyond the last tier', () => {
    const rates = resolveShippingRates(settings, 'US', {
      subtotalCents: 2000,
      totalGrams: 99999,
    })
    expect(rates.some((rate) => rate.rateId === 'wt')).toBe(false)
  })

  it('adds free local pickup when enabled', () => {
    const rates = resolveShippingRates(
      { ...settings, localPickup: true },
      'US',
      { subtotalCents: 2000, totalGrams: 100 },
    )
    expect(rates.some((rate) => rate.rateId === 'pickup')).toBe(true)
  })

  it('returns nothing without a destination or settings', () => {
    expect(resolveShippingRates(settings, undefined, { subtotalCents: 1 }))
      .toEqual([])
    expect(resolveShippingRates(undefined, 'US', { subtotalCents: 1 }))
      .toEqual([])
  })
})
