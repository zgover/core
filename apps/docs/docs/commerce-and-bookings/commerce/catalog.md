---
sidebar_position: 2
title: Product catalog
description: Products with options and variants, categories, tags, and manual or smart collections.
---

# Product catalog

The catalog (AGL-276) is the foundation of Aglyn commerce: every storefront
block, checkout, and order line points back at these documents.

![The product catalog](/img/commerce/products-page.png)

## Products, options, and variants

A **product** is what you manage; a **variant** is what a customer actually
buys. Products define up to **3 options** (like Size or Color, each with up
to 25 values), and the products hub expands them into a variants matrix — up
to **100 variants** per product, each with its own SKU, barcode, price,
compare-at price, weight, image, and inventory count.

- **Types**: `physical` (shippable), `digital` (delivered as downloads), or
  `service`.
- **Status**: `draft` (invisible to visitors), `active`, or `archived`.
- **Pricing**: a variant with a **compare-at price** above its price shows a
  sale badge on storefront blocks.
- **Inventory**: leave blank for untracked, `0` means sold out — the same
  semantics the original product block used.

Products created with the earlier single-price product block are lifted
into this model automatically as a single default variant — nothing breaks
and no migration step is needed.

## Categories and tags

**Categories** are hierarchical (each may have a parent) and slugged for
URLs. **Tags** are free-form labels. Both drive storefront filtering and
smart collections.

## Collections

Collections group products for landing pages and storefront blocks:

- **Manual** collections are an ordered, hand-picked list.
- **Smart** collections define rules — match by tag, category, price, name,
  or product type, with *all* or *any* semantics — and membership updates
  automatically as products change. Draft and archived products never
  appear.

## Slugs

Products, categories, and collections each have a host-unique slug used in
storefront URLs (`/products/{slug}`, `/collections/{slug}`). Slugs are
lowercase letters, numbers, and dashes.

## Related

- [Commerce overview](overview.md)
- [SEO](../../building-sites/seo/overview.md) — products emit structured data and join the
  sitemap automatically.
