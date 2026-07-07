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
  checkEntitlement,
  checkQuota,
  resolveTenantEntitlements,
} from './plan-entitlements'

describe('plan entitlements', () => {
  it('resolves missing/unknown plans as free', () => {
    expect(resolveTenantEntitlements(undefined).hostLimit).toBe(1)
    expect(resolveTenantEntitlements({ plan: 'nope' as any }).hostLimit).toBe(1)
    expect(checkEntitlement(null, 'versioning')).toBe(false)
  })

  it('resolves plan defaults', () => {
    expect(checkEntitlement({ plan: 'pro' } as any, 'versioning')).toBe(true)
    expect(checkEntitlement({ plan: 'starter' } as any, 'versioning')).toBe(
      false,
    )
    expect(
      checkEntitlement({ plan: 'starter' } as any, 'reusableComponents'),
    ).toBe(true)
  })

  it('applies per-tenant overrides key-by-key', () => {
    const tenant = {
      plan: 'free',
      entitlements: { hostLimit: 10, features: { versioning: true } },
    } as any
    const resolved = resolveTenantEntitlements(tenant)
    expect(resolved.hostLimit).toBe(10)
    expect(resolved.features.versioning).toBe(true)
    // untouched defaults survive
    expect(resolved.screensPerHost).toBe(5)
    expect(resolved.features.customDomain).toBe(false)
  })

  it('checkQuota gates at the limit and never reports negative remaining', () => {
    const tenant = { plan: 'free' } as any
    expect(checkQuota(tenant, 'hostLimit', 0)).toEqual({
      allowed: true,
      limit: 1,
      remaining: 1,
    })
    expect(checkQuota(tenant, 'hostLimit', 1).allowed).toBe(false)
    expect(checkQuota(tenant, 'hostLimit', 5).remaining).toBe(0)
  })
})
