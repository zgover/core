---
sidebar_position: 1
title: Commerce
description: Sell physical, digital, and service products with a full catalog, orders pipeline, shipping, taxes, and your own Stripe account.
---

# Commerce

Aglyn commerce sells from **your own Stripe account**: buyers pay you
directly, and Aglyn collects a per-sale platform fee set by your plan (see
[Billing & plans](../billing-and-plans/overview.md) — higher plans reduce
fees to 0%).

```mermaid
sequenceDiagram
  participant V as Visitor
  participant S as Your site
  participant St as Stripe (your account)
  V->>S: Add product to cart
  V->>S: Checkout
  S->>St: Collect payment (+ platform fee)
  St-->>S: Payment confirmed
  S-->>V: Receipt
  S->>S: Create order, adjust inventory, route suppliers
```

:::info Plan availability
**Paid**. Starter sells up to 100 products (2% physical / 7% digital fee);
Pro and Business raise limits and remove fees.
:::

## Products hub

The **Products** page is the catalog manager:

- **Products** with up to 3 options and 100 variants each — per-variant SKU,
  barcode, price, compare-at (sale badge), weight, and stock. See
  [Product catalog](./catalog.md).
- **Categories & collections** — a category tree plus manual and smart
  (rule-based) collections with a live match preview.
- **CSV import/export** in the Shopify column dialect, with a dry-run
  report — switching from Shopify is a file upload.
- **Payments** — Stripe Connect onboarding status and your plan's fee
  ladder.

## Inventory

- Per-variant stock; blank = untracked, 0 = sold out.
- **Oversell policy** per product: stop selling or allow backorders.
- **Low-stock alerts** notify managers once per threshold crossing.
- **Adjustment history** with reason codes (sale, restock, correction…).
- **Locations** split stock across warehouses/storefronts (plan-capped);
  adjustments and POS sales bucket per location.

## Orders

Every paid checkout becomes an order with a sequential number, line-item
snapshots, totals, and a timeline:

- **Statuses**: pending → paid → fulfilled (or partially) → delivered, with
  cancel/refund exits guarded by a status machine.
- **Fulfill with tracking**, print **packing slips**, add internal notes.
- **Refunds** (full or partial) go through Stripe and reverse the platform
  fee; site-admin only.
- **Draft orders**: build an order in the console and send the buyer a
  payment link (Shopify parity).

## Shipping & taxes

- **Shipping zones** own countries ('*' = rest of world); rates are flat,
  free-over-subtotal, or subtotal/weight tiers; optional local pickup.
- **Taxes**: manual per-region rates (state beats country, VAT-style
  inclusive pricing supported) or **Stripe Tax** automatic calculation;
  products can be tax-exempt.

## Dropshipping

Assign a **supplier** to a product and paid orders route automatically —
by email and/or HMAC-signed webhook — with a token link the supplier uses
to post tracking back, which fulfills the order. Pro plan and above.

## Related

- [Product catalog](./catalog.md)
- [Billing & plans](../billing-and-plans/overview.md)
- [Bookings & scheduling](../bookings/overview.md)
