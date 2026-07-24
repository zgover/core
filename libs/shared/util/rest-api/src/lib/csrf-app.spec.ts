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

/**
 * CSRF fails closed without a signing key (AGL-795).
 *
 * `CSRF_SECRET` is read at module load, so each case re-imports the modules
 * under a different environment via `jest.isolateModules`.
 */

function loadCsrf(secret: string | undefined) {
  let mod: typeof import('./csrf-app')
  jest.isolateModules(() => {
    const previous = process.env.CSRF_SECRET
    if (secret === undefined) delete process.env.CSRF_SECRET
    else process.env.CSRF_SECRET = secret
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('./csrf-app')
    if (previous === undefined) delete process.env.CSRF_SECRET
    else process.env.CSRF_SECRET = previous
  })
  return mod!
}

const post = (headers: Record<string, string> = {}) =>
  new Request('https://example.test/api/thing', { method: 'POST', headers })

describe('appCsrfCheck without CSRF_SECRET (AGL-795)', () => {
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => errorSpy.mockRestore())

  it('refuses the request instead of issuing a forgeable token', () => {
    const { appCsrfCheck } = loadCsrf(undefined)
    const result = appCsrfCheck(post())
    // Before this fix an unset secret meant sign(value, '') — deterministic,
    // so anyone could mint a matching cookie/header pair and every check
    // downstream would pass. It reported success while protecting nothing.
    expect(result.ok).toBe(false)
    expect(result.status).toBe(500)
    expect(result.setCookie).toBeUndefined()
  })

  it('refuses even a well-formed double-submit pair', () => {
    const { appCsrfCheck } = loadCsrf('')
    const result = appCsrfCheck(
      new Request('https://example.test/api/thing', {
        method: 'POST',
        headers: { cookie: 'XSRF-TOKEN=abc', 'xsrf-token': 'abc' },
      }),
    )
    expect(result.ok).toBe(false)
  })

  it('says why, once, on stderr', () => {
    const { appCsrfCheck } = loadCsrf(undefined)
    appCsrfCheck(post())
    appCsrfCheck(post())
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(String(errorSpy.mock.calls[0][0])).toContain('CSRF_SECRET is not set')
  })
})

describe('appCsrfCheck with CSRF_SECRET set', () => {
  it('issues a token on a first request', () => {
    const { appCsrfCheck } = loadCsrf('a-real-signing-key')
    const result = appCsrfCheck(post())
    // Configured: the normal double-submit flow resumes — mint and proceed.
    expect(result.ok).toBe(true)
    expect(result.setCookie).toContain('XSRF-TOKEN=')
  })

  it('still rejects a mutating request with a cookie but no header', () => {
    const { appCsrfCheck } = loadCsrf('a-real-signing-key')
    const result = appCsrfCheck(
      new Request('https://example.test/api/thing', {
        method: 'POST',
        headers: { cookie: 'XSRF-TOKEN=whatever' },
      }),
    )
    expect(result.ok).toBe(false)
    expect(result.status).toBe(403)
  })
})
