/**
 * @license
 * Copyright 2022 Aglyn LLC
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

//     ____  _________________   ____________________  _   _______
//    / __ \/ ____/ ____/  _/ | / /  _/_  __/  _/ __ \/ | / / ___/
//   / / / / __/ / /_   / //  |/ // /  / /  / // / / /  |/ /\__ \
//  / /_/ / /___/ __/ _/ // /|  // /  / / _/ // /_/ / /|  /___/ /
// /_____/_____/_/   /___/_/ |_/___/ /_/ /___/\____/_/ |_//____/
// 👇

export * from './definitions/components.types'
export * from './definitions/organization.types'
export * from './definitions/shared'
export {
  ActivityAccess,
  HostEntityType,
  HostRedirectParams,
  HostScreenStatus,
  HostScreenVisibility,
  HostViewFormat,
  HostViewType,
} from './definitions/platform.types'
// AglynScreenVersion/AglynLayoutVersion are exported (specialized with the
// SDK's NodeSchema) from ../types/screen instead of this generic form.
// Org billing vocabulary (historic Tenant* names — see the glossary and
// definitions/org-billing.types.ts; AglynOrgBilling is the name for new
// code).
export type {
  AglynOrgBilling,
  AglynTenant,
  TenantEntitlements,
  TenantFeatureFlags,
  TenantPlan,
  TenantSeatAddons,
  TenantSubscription,
  TenantUid,
} from './definitions/org-billing.types'
export type {
  AglynAccessRule,
  AglynAuthRole,
  AglynDocument,
  AglynHost,
  AglynHostComponent,
  AglynHostMedia,
  AglynHostMediaFolder,
  AglynHostTheme,
  AglynLayout,
  AglynRedirect,
  AglynRolePermission,
  AglynScreen,
  AglynUser,
  ComponentDefUid,
  HostAnnouncementBar,
  HostPopup,
  HostMediaUid,
  HostPath,
  HostUid,
  LayoutUid,
  PermissionUid,
  ProjectNumber,
  ProjectUid,
  PublishSchedule,
  RedirectUid,
  RoleUid,
  ScreenSlug,
  ScreenUid,
  UserUid,
  VersionUid,
} from './definitions/platform.types'

//    __________  _   ________________    _   _____________
//   / ____/ __ \/ | / / ___/_  __/   |  / | / /_  __/ ___/
//  / /   / / / /  |/ /\__ \ / / / /| | /  |/ / / /  \__ \
// / /___/ /_/ / /|  /___/ // / / ___ |/ /|  / / /  ___/ /
// \____/\____/_/ |_//____//_/ /_/  |_/_/ |_/ /_/  /____/
// 👇

export * from './constants/_internal'
export * from './constants/app'
export * from './constants/canvas'
export * from './constants/components'
export * from './constants/shared'
export * from './constants/symbol'
