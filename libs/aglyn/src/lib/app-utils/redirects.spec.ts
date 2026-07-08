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
  isSelfRedirect,
  normalizeRedirectDestination,
  normalizeRedirectSource,
} from './redirects'

describe('normalizeRedirectSource', () => {
  it('normalizes case, slashes, and query strings', () => {
    expect(normalizeRedirectSource('Old-Page/')).toBe('/old-page')
    expect(normalizeRedirectSource('/A/B/?utm=x')).toBe('/a/b')
    expect(normalizeRedirectSource('/')).toBe('/')
  })

  it('rejects absolute URLs and junk', () => {
    expect(normalizeRedirectSource('https://example.com/x')).toBeNull()
    expect(normalizeRedirectSource('//evil.com')).toBeNull()
    expect(normalizeRedirectSource('  ')).toBeNull()
    expect(normalizeRedirectSource('/has space')).toBeNull()
  })
})

describe('normalizeRedirectDestination', () => {
  it('accepts internal paths and https URLs', () => {
    expect(normalizeRedirectDestination('/pricing/')).toBe('/pricing')
    expect(normalizeRedirectDestination('https://example.com/x')).toBe(
      'https://example.com/x',
    )
  })

  it('rejects http, protocol-relative, and junk', () => {
    expect(normalizeRedirectDestination('http://example.com')).toBeNull()
    expect(normalizeRedirectDestination('//example.com')).toBeNull()
    expect(normalizeRedirectDestination('javascript:alert(1)')).toBeNull()
  })
})

describe('isSelfRedirect', () => {
  it('catches loops onto the same path, case-insensitively', () => {
    expect(
      isSelfRedirect({ source: '/old', destination: '/Old/' }),
    ).toBe(true)
    expect(
      isSelfRedirect({ source: '/old', destination: '/new' }),
    ).toBe(false)
    expect(
      isSelfRedirect({
        source: '/old',
        destination: 'https://example.com/old',
      }),
    ).toBe(false)
  })
})
