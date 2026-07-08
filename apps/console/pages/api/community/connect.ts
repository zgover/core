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

import { firebaseAdmin } from '@aglyn/tenant-data-admin'
import type { NextApiRequest, NextApiResponse } from 'next'

async function stripe(path: string, params?: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(params && {
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    },
    ...(params && { body: params.toString() }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Stripe ${path} failed`)
  }
  return payload
}

/**
 * Stripe Connect onboarding for community publishers (AGL-46): creates an
 * Express account on first call (id stored on the profile via Admin SDK),
 * refreshes `stripeChargesEnabled` on every call, and returns an
 * account-link URL while onboarding is incomplete. 501 without Stripe env.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res
      .status(501)
      .json({ error: 'Payouts are not configured (STRIPE_SECRET_KEY).' })
  }
  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    const firestore = firebaseAdmin.app().firestore()
    const profileRef = firestore.collection('profiles').doc(decoded.uid)
    const profileSnapshot = await profileRef.get()
    if (!profileSnapshot.exists) {
      return res
        .status(412)
        .json({ error: 'Create your community profile first' })
    }

    let accountId = profileSnapshot.get('stripeAccountId') as
      | string
      | undefined
    if (!accountId) {
      const account = await stripe(
        'accounts',
        new URLSearchParams({
          type: 'express',
          'metadata[profileId]': decoded.uid,
          ...(decoded.email ? { email: decoded.email } : {}),
        }),
      )
      accountId = account.id
      await profileRef.set(
        { stripeAccountId: accountId, stripeChargesEnabled: false },
        { merge: true },
      )
    }

    const account = await stripe(`accounts/${accountId}`)
    const chargesEnabled = Boolean(account?.charges_enabled)
    await profileRef.set(
      { stripeChargesEnabled: chargesEnabled },
      { merge: true },
    )
    if (chargesEnabled) {
      return res.status(200).json({ accountId, chargesEnabled: true })
    }

    const origin = req.headers.origin ?? `https://${req.headers.host}`
    const link = await stripe(
      'account_links',
      new URLSearchParams({
        account: accountId as string,
        type: 'account_onboarding',
        refresh_url: `${origin}/manage/community?connect=refresh`,
        return_url: `${origin}/manage/community?connect=done`,
      }),
    )
    return res
      .status(200)
      .json({ accountId, chargesEnabled: false, url: link.url })
  } catch (error) {
    console.error(error)
    return res.status(502).json({ error: 'Payout setup failed' })
  }
}
