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

import type {
  AglynTenant,
  TenantEntitlements,
  TenantFeatureFlags,
  TenantPlan,
} from '../foundation'

/**
 * Plan → default entitlements. Versioned with the app so pricing changes are
 * code-reviewed; per-tenant overrides live on `tenant.entitlements` and win
 * key-by-key. Draft tier table from the Tenant Billing & SaaS Plans project
 * (2026-07-06) — treat as source until pricing is finalized. Costs are
 * passed through from Firebase/Vercel at cost × 1.30.
 */
export const PLAN_ENTITLEMENTS: Record<
  TenantPlan,
  Required<Omit<TenantEntitlements, 'features'>> & {
    features: Required<TenantFeatureFlags>
  }
> = {
  free: {
    hostLimit: 1,
    screensPerHost: 5,
    sharedLayoutsPerHost: 1,
    storagePerHostMb: 100,
    totalSiteSizeMb: 250,
    membersPerHost: 1,
    bandwidthGb: 5,
    features: {
      versioning: false,
      reusableComponents: false,
      customDomain: false,
      removeBranding: false,
    },
  },
  starter: {
    hostLimit: 2,
    screensPerHost: 25,
    sharedLayoutsPerHost: 5,
    storagePerHostMb: 1024,
    totalSiteSizeMb: 2048,
    membersPerHost: 3,
    bandwidthGb: 50,
    features: {
      versioning: false,
      reusableComponents: true,
      customDomain: true,
      removeBranding: false,
    },
  },
  pro: {
    hostLimit: 5,
    screensPerHost: 100,
    sharedLayoutsPerHost: 20,
    storagePerHostMb: 5120,
    totalSiteSizeMb: 10240,
    membersPerHost: 10,
    bandwidthGb: 250,
    features: {
      versioning: true,
      reusableComponents: true,
      customDomain: true,
      removeBranding: true,
    },
  },
  business: {
    hostLimit: 25,
    screensPerHost: 500,
    sharedLayoutsPerHost: 100,
    storagePerHostMb: 20480,
    totalSiteSizeMb: 51200,
    membersPerHost: 50,
    bandwidthGb: 1000,
    features: {
      versioning: true,
      reusableComponents: true,
      customDomain: true,
      removeBranding: true,
    },
  },
}

function resolvePlan(tenant: Partial<AglynTenant> | null | undefined) {
  const plan = tenant?.plan
  return plan && plan in PLAN_ENTITLEMENTS ? plan : 'free'
}

/**
 * Effective entitlements for a tenant: plan defaults with the tenant doc's
 * per-key overrides applied (features merge key-by-key too). Missing or
 * unknown plans resolve as `free`.
 */
export function resolveTenantEntitlements(
  tenant: Partial<AglynTenant> | null | undefined,
): Required<Omit<TenantEntitlements, 'features'>> & {
  features: Required<TenantFeatureFlags>
} {
  const defaults = PLAN_ENTITLEMENTS[resolvePlan(tenant)]
  const overrides = tenant?.entitlements
  if (!overrides) return defaults
  const { features: featureOverrides, ...quotaOverrides } = overrides
  const merged = { ...defaults }
  for (const [key, value] of Object.entries(quotaOverrides)) {
    if (typeof value === 'number') (merged as any)[key] = value
  }
  return {
    ...merged,
    features: { ...defaults.features, ...featureOverrides },
  }
}

/** True when the tenant's plan (or overrides) enables the boolean feature. */
export function checkEntitlement(
  tenant: Partial<AglynTenant> | null | undefined,
  feature: keyof TenantFeatureFlags,
): boolean {
  return Boolean(resolveTenantEntitlements(tenant).features[feature])
}

/**
 * Quota check: `allowed` is false once `currentUsage` meets the limit —
 * call before creating the next resource (e.g. usage=hostCount before
 * creating another host). `remaining` never goes negative.
 */
export function checkQuota(
  tenant: Partial<AglynTenant> | null | undefined,
  quota: keyof Omit<TenantEntitlements, 'features'>,
  currentUsage: number,
): { allowed: boolean; limit: number; remaining: number } {
  const limit = resolveTenantEntitlements(tenant)[quota]
  return {
    allowed: currentUsage < limit,
    limit,
    remaining: Math.max(0, limit - currentUsage),
  }
}
