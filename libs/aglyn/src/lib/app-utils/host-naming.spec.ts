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
  generateSubdomain,
  isBlockedSubdomain,
  SUBDOMAIN_PATTERN,
  suggestSubdomains,
} from './host-naming'

describe('isBlockedSubdomain', () => {
  it('blocks reserved platform names', () => {
    expect(isBlockedSubdomain('www')).toBe(true)
    expect(isBlockedSubdomain('admin')).toBe(true)
    expect(isBlockedSubdomain('aglyn')).toBe(true)
  })

  it('blocks profanity fragments even with separators', () => {
    expect(isBlockedSubdomain('total-shit-show')).toBe(true)
    // Separator evasion is collapsed before matching.
    expect(isBlockedSubdomain('sh-it')).toBe(true)
  })

  it('allows ordinary names', () => {
    expect(isBlockedSubdomain('my-bakery')).toBe(false)
    expect(isBlockedSubdomain('demo-2')).toBe(false)
  })
})

describe('generateSubdomain', () => {
  it('slugifies display names', () => {
    expect(generateSubdomain('My Great Bakery!')).toBe('my-great-bakery')
    expect(generateSubdomain('Café Aglyn & Co.')).toBe('cafe-aglyn-co')
  })

  it('returns empty for unusable or blocked names', () => {
    expect(generateSubdomain('!!')).toBe('')
    expect(generateSubdomain('Admin')).toBe('')
  })

  it('caps at 30 chars and stays valid', () => {
    const slug = generateSubdomain('A'.repeat(80) + ' bakery')
    expect(slug.length).toBeLessThanOrEqual(30)
    expect(SUBDOMAIN_PATTERN.test(slug)).toBe(true)
  })
})

describe('suggestSubdomains', () => {
  it('offers -2, -year, and -site variants', () => {
    expect(suggestSubdomains('bakery', 2026)).toEqual([
      'bakery-2',
      'bakery-2026',
      'bakery-site',
    ])
  })

  it('keeps every candidate within the pattern', () => {
    for (const candidate of suggestSubdomains('a'.repeat(30), 2026)) {
      expect(SUBDOMAIN_PATTERN.test(candidate)).toBe(true)
    }
  })
})
