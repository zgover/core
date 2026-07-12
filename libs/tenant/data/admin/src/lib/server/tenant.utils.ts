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

import * as Aglyn from '@aglyn/aglyn/server'
import type { Database, DataSnapshot } from 'firebase-admin/database'
import firebaseAdmin from './firebase-admin'

// Lazy: resolving the database at module scope required an initialized
// admin app at IMPORT time, which crashed App Router builds (page-data
// collection evaluates route modules; fbserver skips init without full
// credentials). First call resolves it instead — runtime-identical, since
// every real runtime initializes the app before serving a request.
let db: Database | undefined
function tenantsRef() {
  if (!db) {
    db = firebaseAdmin.database()
  }
  return db.ref(`tenants`)
}

export function setAdminTenant(tenant: Aglyn.AglynTenant): Promise<void> {
  const { $id, ...rest } = tenant
  return tenantsRef().child($id).set(rest)
}

export function getAdminTenant(
  tenantId: Aglyn.TenantUid,
): Promise<DataSnapshot> {
  return tenantsRef().child(tenantId).get()
}
