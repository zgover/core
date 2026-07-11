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
  commerceSlug,
  expandVariantMatrix,
  findVariant,
  liftLegacyProduct,
  matchesCollection,
  productInventory,
  productPriceRange,
  validateCollection,
  validateProduct,
  type HostCollection,
  type HostProduct,
} from './commerce'

function product(overrides: Partial<HostProduct> = {}): HostProduct {
  return {
    name: 'Front Brake Pads',
    slug: 'front-brake-pads',
    type: 'physical',
    status: 'active',
    variants: [{ id: 'default', priceUsd: 25 }],
    ...overrides,
  }
}

describe('commerceSlug', () => {
  it('kebab-cases and strips diacritics/symbols', () => {
    expect(commerceSlug('Öhlins Shock — 46mm!')).toBe('ohlins-shock-46mm')
  })
  it('trims leading/trailing dashes', () => {
    expect(commerceSlug('  --Sale!--  ')).toBe('sale')
  })
})

describe('expandVariantMatrix', () => {
  it('returns a single default combo without options', () => {
    expect(expandVariantMatrix(undefined)).toEqual([{}])
    expect(expandVariantMatrix([])).toEqual([{}])
  })
  it('builds the cartesian product', () => {
    const combos = expandVariantMatrix([
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Color', values: ['Red', 'Blue'] },
    ])
    expect(combos).toHaveLength(4)
    expect(combos).toContainEqual({ Size: 'M', Color: 'Blue' })
  })
  it('caps at the variant ceiling', () => {
    const many = Array.from({ length: 30 }, (_, index) => `v${index}`)
    const combos = expandVariantMatrix([
      { name: 'A', values: many },
      { name: 'B', values: many },
    ])
    expect(combos.length).toBeLessThanOrEqual(100)
  })
})

describe('findVariant / productPriceRange / productInventory', () => {
  const multi = product({
    options: [{ name: 'Size', values: ['S', 'M'] }],
    variants: [
      { id: 's', options: { Size: 'S' }, priceUsd: 20, inventory: 3 },
      { id: 'm', options: { Size: 'M' }, priceUsd: 30, inventory: null },
    ],
  })
  it('matches exact option selections only', () => {
    expect(findVariant(multi, { Size: 'M' })?.id).toBe('m')
    expect(findVariant(multi, { Size: 'L' })).toBeUndefined()
    expect(findVariant(multi, {})).toBeUndefined()
  })
  it('computes the price range', () => {
    expect(productPriceRange(multi)).toEqual([20, 30])
    expect(productPriceRange({ variants: [] })).toEqual([0, 0])
  })
  it('sums only tracked inventory, null when all untracked', () => {
    expect(productInventory(multi)).toBe(3)
    expect(
      productInventory({ variants: [{ id: 'x', priceUsd: 1 }] }),
    ).toBeNull()
  })
})

describe('matchesCollection', () => {
  const smart: HostCollection = {
    name: 'Under $50',
    slug: 'under-50',
    mode: 'smart',
    rules: [
      { field: 'priceUsd', op: 'lt', value: 50 },
      { field: 'tag', op: 'eq', value: 'brakes' },
    ],
  }
  it('applies AND semantics by default', () => {
    expect(matchesCollection(product({ tags: ['brakes'] }), smart)).toBe(true)
    expect(matchesCollection(product({ tags: [] }), smart)).toBe(false)
  })
  it('applies OR semantics when matchAll is false', () => {
    expect(
      matchesCollection(product({ tags: [] }), { ...smart, matchAll: false }),
    ).toBe(true)
  })
  it('never matches draft or deleted products', () => {
    expect(
      matchesCollection(product({ status: 'draft', tags: ['brakes'] }), smart),
    ).toBe(false)
    expect(
      matchesCollection(
        product({ deletedAt: 1, tags: ['brakes'] }),
        smart,
      ),
    ).toBe(false)
  })
  it('answers manual collections from productIds', () => {
    const manual: HostCollection = {
      name: 'Featured',
      slug: 'featured',
      mode: 'manual',
      productIds: ['p1'],
    }
    expect(matchesCollection(product(), manual, 'p1')).toBe(true)
    expect(matchesCollection(product(), manual, 'p2')).toBe(false)
  })
})

describe('liftLegacyProduct', () => {
  it('lifts a Commerce Starter doc into a default variant', () => {
    const lifted = liftLegacyProduct({
      name: 'Sticker pack',
      priceUsd: 5,
      inventory: 10,
    })
    expect(lifted.variants).toEqual([
      { id: 'default', priceUsd: 5, inventory: 10 },
    ])
    expect(lifted.slug).toBe('sticker-pack')
    expect(lifted.status).toBe('active')
  })
  it('passes catalog-shaped docs through unchanged', () => {
    const shaped = product()
    expect(liftLegacyProduct(shaped)).toBe(shaped)
  })
})

describe('validateProduct', () => {
  it('accepts a minimal valid product', () => {
    expect(validateProduct(product())).toBeNull()
  })
  it('rejects bad slugs, empty variants, dup ids/skus, bad prices', () => {
    expect(validateProduct(product({ slug: 'Bad Slug' }))).toMatch(/Slug/)
    expect(validateProduct(product({ variants: [] }))).toMatch(/variant/)
    expect(
      validateProduct(
        product({
          variants: [
            { id: 'a', priceUsd: 1 },
            { id: 'a', priceUsd: 2 },
          ],
        }),
      ),
    ).toMatch(/unique/)
    expect(
      validateProduct(
        product({
          variants: [
            { id: 'a', priceUsd: 1, sku: 'X' },
            { id: 'b', priceUsd: 2, sku: 'X' },
          ],
        }),
      ),
    ).toMatch(/SKU/)
    expect(
      validateProduct(product({ variants: [{ id: 'a', priceUsd: -1 }] })),
    ).toMatch(/zero or more/)
    expect(
      validateProduct(product({ variants: [{ id: 'a', priceUsd: 20000 }] })),
    ).toMatch(/capped/)
  })
  it('rejects compare-at at or below price', () => {
    expect(
      validateProduct(
        product({
          variants: [{ id: 'a', priceUsd: 10, compareAtPriceUsd: 10 }],
        }),
      ),
    ).toMatch(/Compare-at/)
  })
})

describe('validateCollection', () => {
  it('accepts manual and rule-complete smart collections', () => {
    expect(
      validateCollection({
        name: 'Featured',
        slug: 'featured',
        mode: 'manual',
      }),
    ).toBeNull()
    expect(
      validateCollection({
        name: 'Cheap',
        slug: 'cheap',
        mode: 'smart',
        rules: [{ field: 'priceUsd', op: 'lt', value: 10 }],
      }),
    ).toBeNull()
  })
  it('rejects smart collections without rules', () => {
    expect(
      validateCollection({ name: 'X', slug: 'x', mode: 'smart', rules: [] }),
    ).toMatch(/rule/)
  })
})
