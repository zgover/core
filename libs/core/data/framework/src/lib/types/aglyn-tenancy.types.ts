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

import {type PageUid} from './aglyn-pages.types'


export type TenantUid = string
export type HostUid = string
export type RoleUid = string
export type PermissionUid = string
export type UserUid = string

export interface AglynUser {
  $id: UserUid
  roleId?: RoleUid
  superAdmin?: boolean
  email?: string
}

export interface AglynRole {
  $id: RoleUid
  displayName?: string
  description?: string
  permissions?: PermissionUid[]
}

export interface AglynPermission {
  $id: PermissionUid
  displayName?: string
  description?: string
}

export interface AglynTenant {
  $id: TenantUid
  ownerId?: UserUid
  displayName?: string
  organization?: string
  hosts?: Record<HostUid, true>
  subOwners?: Record<UserUid, true>
}

export interface AglynHost {
  $id: HostUid
  tenantId?: TenantUid
  cname?: string
  displayName?: string
  title?: string
  description?: string
  pages?: Record<PageUid, true>
}
