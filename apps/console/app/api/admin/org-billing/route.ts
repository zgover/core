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
import { firebaseAdmin } from '@aglyn/tenant-data-admin'

/**
 * Staff org billing detail (AGL-245): the org's Stripe invoice history
 * and default payment method, straight from Stripe by the mirrored
 * customer id. Read-only; plan/entitlement overrides stay on the audited
 * staff org endpoints. 501 without Stripe env.
 */
async function handler(request: Request): Promise<Response> {
  const { method, query, headers: rawHeaders } = await pluginRequestFromWeb(request)
  const headers = rawHeaders as Partial<Record<string, string>>
  if (method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const authorization = headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  const orgId = String(query.orgId ?? '')
  if (!orgId) return Response.json({ error: 'Missing orgId' }, { status: 400 })
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 501 })
  }

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    if (!decoded['staff']) {
      return Response.json({ error: 'Staff only' }, { status: 403 })
    }
    const org = await firebaseAdmin
      .app()
      .firestore()
      .collection('orgs')
      .doc(orgId)
      .get()
    const customerId = org.get('stripeCustomerId')
    if (!customerId) {
      return Response.json({ invoices: [], paymentMethod: null }, { status: 200 })
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
    return Response.json({
      invoices,
      paymentMethod,
      delinquent: customerPayload?.delinquent === true,
    }, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Billing lookup failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export { handler as GET }
