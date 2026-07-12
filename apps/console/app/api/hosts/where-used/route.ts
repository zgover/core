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

import { pluginRequestFromWeb } from '@aglyn/aglyn/server'
import {
  type BindingRefVia,
  nodesReferenceBinding,
} from '@aglyn/aglyn/server'
import { firebaseAdmin } from '@aglyn/tenant-data-admin'

export interface WhereUsedDependent {
  /** Resource collection the dependent lives in. */
  type: 'screen' | 'layout' | 'workflow' | 'variable'
  id: string
  name: string
  /** 'id' = rename-safe reference; 'name' = legacy token, breaks on rename. */
  via: BindingRefVia[]
  /** Published version scanned (screens/layouts) — deep-link target. */
  versionId?: string
}

/**
 * Where-used scan (AGL-187): finds host content referencing a variable,
 * function, or workflow. Screens/layouts are scanned on their PUBLISHED
 * version's nodes (matching what visitors see); workflow steps are
 * checked for function calls and variables for workflow backings. The
 * `via` field distinguishes rename-safe id references from legacy name
 * tokens — renames only endanger the latter. Auth: Firebase ID token,
 * host admin.
 */
async function handler(request: Request): Promise<Response> {
  const { method, body, headers: rawHeaders } = await pluginRequestFromWeb(request)
  const headers = rawHeaders as Partial<Record<string, string>>
  if (method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const hostId = String(body?.hostId ?? '')
  const kind = String(body?.kind ?? '') as
    | 'variable'
    | 'function'
    | 'workflow'
  const refId = String(body?.id ?? '')
  const refName = String(body?.name ?? '')
  if (
    !hostId ||
    !refId ||
    !['variable', 'function', 'workflow'].includes(kind)
  ) {
    return Response.json({ error: 'Missing hostId, id, or kind' }, { status: 400 })
  }

  const authorization = headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    const hostRef = firebaseAdmin
      .app()
      .firestore()
      .collection('hosts')
      .doc(hostId)
    const hostSnapshot = await hostRef.get()
    if (!hostSnapshot.exists) {
      return Response.json({ error: 'Unknown site' }, { status: 404 })
    }
    const memberRole = (hostSnapshot.get('memberRoles') ?? {})[decoded.uid]
    if (!memberRole) {
      return Response.json({ error: 'Not a site admin' }, { status: 403 })
    }

    const dependents: WhereUsedDependent[] = []

    if (kind === 'variable' || kind === 'function') {
      const ref = { kind, id: refId, name: refName || undefined }
      // Published-version nodes of screens and layouts.
      for (const collectionName of ['screens', 'layouts'] as const) {
        const docs = await hostRef.collection(collectionName).limit(200).get()
        for (const docSnapshot of docs.docs) {
          if (docSnapshot.get('deletedAt')) continue
          const versionId = docSnapshot.get('versionId')
          if (!versionId) continue
          const version = await docSnapshot.ref
            .collection('versions')
            .doc(String(versionId))
            .get()
            .catch(() => null)
          const nodes = version?.get('nodes')
          if (!nodes) continue
          const via = nodesReferenceBinding(nodes, ref)
          if (via.length) {
            dependents.push({
              type: collectionName === 'screens' ? 'screen' : 'layout',
              id: docSnapshot.id,
              name: String(docSnapshot.get('name') ?? docSnapshot.id),
              via,
              versionId: String(versionId),
            })
          }
        }
      }
    }

    if (kind === 'function') {
      // Workflow steps call functions by name (AGL-129).
      const workflows = await hostRef.collection('workflows').limit(100).get()
      for (const docSnapshot of workflows.docs) {
        if (docSnapshot.get('deletedAt')) continue
        const steps = (docSnapshot.get('steps') ?? []) as Array<{
          functionName?: string
        }>
        if (
          refName &&
          steps.some((step) => String(step?.functionName ?? '') === refName)
        ) {
          dependents.push({
            type: 'workflow',
            id: docSnapshot.id,
            name: String(docSnapshot.get('name') ?? docSnapshot.id),
            via: ['name'],
          })
        }
      }
    }

    if (kind === 'workflow') {
      // Computed variables back onto workflows by name (AGL-129).
      const variables = await hostRef.collection('variables').limit(100).get()
      for (const docSnapshot of variables.docs) {
        if (docSnapshot.get('deletedAt')) continue
        if (
          refName &&
          String(docSnapshot.get('workflowName') ?? '') === refName
        ) {
          dependents.push({
            type: 'variable',
            id: docSnapshot.id,
            name: String(docSnapshot.get('name') ?? docSnapshot.id),
            via: ['name'],
          })
        }
      }
    }

    return Response.json({
      dependents,
      total: dependents.length,
      // Any dependent still holding a legacy name token: a rename breaks it.
      legacyCount: dependents.filter((item) => item.via.includes('name'))
        .length,
    }, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Scan failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export { handler as POST }
