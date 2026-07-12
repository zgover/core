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
  checkEntitlement,
  COMMUNITY_MAX_PRICE_USD,
  createResourceUid,
  pluginArtifactPath,
  validatePluginManifest,
} from '@aglyn/aglyn/server'
import { firebaseAdmin, getOrgForUser } from '@aglyn/tenant-data-admin'
import { createHash } from 'crypto'
import { resolveOrgPermissions } from '@aglyn/tenant-runtime/org-permissions'

// Base64 bundle bodies: a small JS plugin bundle, capped generously.
const MAX_BUNDLE_BYTES = 5 * 1024 * 1024

/**
 * Publishes an executable plugin to the community (AGL-45), per the AGL-43
 * artifact pipeline. Runs server-side so validation (manifest schema, size
 * caps) can't be bypassed: the bundle is content-addressed (sha256) and
 * written IMMUTABLY to the isolated artifacts bucket, and the version entry
 * records the hash the loader verifies before executing. Env-gated on
 * `PLUGIN_ARTIFACTS_BUCKET` (a separate Firebase project/bucket keeps a
 * bucket-level blast radius) — 501 degrades like other platform infra.
 * Requirements: host admin, publish permission, community profile, Pro
 * plan; paid listings need completed Stripe Connect onboarding.
 */
async function handler(request: Request): Promise<Response> {
  const { method, body, headers: rawHeaders } = await pluginRequestFromWeb(request)
  const headers = rawHeaders as Partial<Record<string, string>>
  if (method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const displayName = String(body?.displayName ?? '').slice(0, 80)
  const description = String(body?.description ?? '').slice(0, 500)
  const category = String(body?.category ?? '').slice(0, 40)
  const changelog = String(body?.changelog ?? '').slice(0, 1000)
  const priceUsd = Math.round(Number(body?.priceUsd ?? 0)) || 0
  const bundleBase64 = String(body?.bundle ?? '')
  if (priceUsd < 0 || priceUsd > COMMUNITY_MAX_PRICE_USD) {
    return Response.json({ error: `Price must be 0–${COMMUNITY_MAX_PRICE_USD} USD` }, { status: 400 })
  }
  if (!displayName.trim() || !bundleBase64) {
    return Response.json({ error: 'Missing displayName or bundle' }, { status: 400 })
  }

  const validation = validatePluginManifest(body?.manifest)
  if (validation.ok === false) {
    return Response.json({ error: validation.error }, { status: 422 })
  }
  const manifest = validation.manifest

  const authorization = headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    const membership = await resolveOrgPermissions(decoded.uid)
    if (!membership.permissions.publishToCommunity) {
      return Response.json({
        error: 'Your organization role does not allow publishing to the community',
      }, { status: 403 })
    }
    const firestore = firebaseAdmin.app().firestore()

    // Plan gate rides the caller's org doc (AGL-238).
    const tenant = (await getOrgForUser(decoded.uid))?.org ?? {}
    if (tenant['plan'] && !checkEntitlement(tenant, 'marketplaceSelling')) {
      return Response.json({ error: 'Publishing to the community requires a Pro plan' }, { status: 403 })
    }

    const profileSnapshot = await firestore
      .collection('profiles')
      .doc(decoded.uid)
      .get()
    if (!profileSnapshot.exists || !profileSnapshot.get('handle')) {
      return Response.json({
        error:
          'Create your community profile first (Manage → Community profile)',
      }, { status: 412 })
    }
    if (priceUsd > 0 && !profileSnapshot.get('stripeChargesEnabled')) {
      return Response.json({
        error: 'Set up payouts first (Manage → Community profile) to sell',
      }, { status: 412 })
    }

    const bundle = Buffer.from(bundleBase64, 'base64')
    if (!bundle.length || bundle.length > MAX_BUNDLE_BYTES) {
      return Response.json({ error: 'Bundle is empty or too large' }, { status: 413 })
    }
    const sha256 = createHash('sha256')
      .update(new Uint8Array(bundle))
      .digest('hex')

    // Isolated artifacts bucket (AGL-43 §3). Without it configured we
    // refuse rather than store executable code in the app bucket.
    const artifactsBucket = process.env.PLUGIN_ARTIFACTS_BUCKET
    if (!artifactsBucket) {
      return Response.json({
        error:
          'Plugin publishing is not configured (missing ' +
          'PLUGIN_ARTIFACTS_BUCKET).',
      }, { status: 501 })
    }

    // One listing per publisher+plugin id: re-publishing bumps the version.
    const existing = await firestore
      .collection('communityListings')
      .where('profileId', '==', decoded.uid)
      .where('pluginId', '==', manifest.id)
      .limit(1)
      .get()
    const listingRef = existing.empty
      ? firestore.collection('communityListings').doc(createResourceUid())
      : existing.docs[0].ref

    // Immutable content-addressed write — a new build is a new object, so a
    // consumer's pinned version can never be overwritten underneath it.
    const objectPath = pluginArtifactPath(
      listingRef.id,
      manifest.version,
      sha256,
    )
    const bucket = firebaseAdmin.app().storage().bucket(artifactsBucket)
    const file = bucket.file(objectPath)
    const [alreadyStored] = await file.exists()
    if (!alreadyStored) {
      await file.save(bundle, {
        contentType: 'application/javascript',
        metadata: {
          cacheControl: 'public, max-age=31536000, immutable',
        },
      })
    }

    const now = firebaseAdmin.firestore.FieldValue.serverTimestamp()
    await listingRef.set(
      {
        type: 'plugin',
        profileId: decoded.uid,
        pluginId: manifest.id,
        displayName: displayName.trim(),
        ...(description.trim() && { description: description.trim() }),
        ...(category.trim() && { category: category.trim() }),
        priceUsd,
        latestVersion: manifest.version,
        deletedAt: null,
        ...(existing.empty && { createdAt: now }),
        updatedAt: now,
      },
      { merge: true },
    )
    // Version snapshots are server-only; the loader reads sha256 + manifest
    // to verify integrity and stamp CSP before executing.
    await listingRef
      .collection('pluginVersions')
      .doc(manifest.version)
      .set({
        version: manifest.version,
        sha256,
        objectPath,
        manifest,
        ...(changelog.trim() && { changelog: changelog.trim() }),
        publishedAt: now,
      })

    return Response.json({ listingId: listingRef.id, version: manifest.version, sha256 }, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Publish failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export { handler as POST }
