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

/**
 * Staff org billing detail (AGL-245): the org's Stripe invoice history
 * and default payment method, straight from Stripe by the mirrored
 * customer id. Read-only; plan/entitlement overrides stay on the audited
 * staff org endpoints. 501 without Stripe env.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })
  const orgId = String(req.query.orgId ?? '')
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' })
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return res.status(501).json({ error: 'Stripe is not configured' })
  }

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    if (!decoded['staff']) {
      return res.status(403).json({ error: 'Staff only' })
    }
    const org = await firebaseAdmin
      .app()
      .firestore()
      .collection('orgs')
      .doc(orgId)
      .get()
    const customerId = org.get('stripeCustomerId')
    if (!customerId) {
      return res.status(200).json({ invoices: [], paymentMethod: null })
    }
    const headers = { Authorization: `Bearer ${stripeKey}` }
    const [invoicesResponse, customerResponse] = await Promise.all([
      fetch(
        `https://api.stripe.com/v1/invoices?customer=${encodeURIComponent(
          String(customerId),
        )}&limit=24`,
        { headers },
      ),
      fetch(
        `https://api.stripe.com/v1/customers/${encodeURIComponent(
          String(customerId),
        )}?expand[]=invoice_settings.default_payment_method`,
        { headers },
      ),
    ])
    const invoicesPayload = await invoicesResponse.json()
    const customerPayload = await customerResponse.json()
    const invoices = Array.isArray(invoicesPayload?.data)
      ? invoicesPayload.data.map((invoice: any) => ({
          id: invoice.id,
          number: invoice.number ?? null,
          status: invoice.status ?? null,
          amountDueCents: invoice.amount_due ?? 0,
          amountPaidCents: invoice.amount_paid ?? 0,
          currency: invoice.currency ?? 'usd',
          periodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000).toISOString()
            : null,
          periodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000).toISOString()
            : null,
          hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
        }))
      : []
    const card =
      customerPayload?.invoice_settings?.default_payment_method?.card ?? null
    const paymentMethod = card
      ? {
          brand: card.brand ?? null,
          last4: card.last4 ?? null,
          expMonth: card.exp_month ?? null,
          expYear: card.exp_year ?? null,
        }
      : null
    return res.status(200).json({
      invoices,
      paymentMethod,
      delinquent: customerPayload?.delinquent === true,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Billing lookup failed' })
  }
}
