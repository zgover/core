---
sidebar_position: 1
slug: /
title: Welcome to Aglyn
description: What Aglyn is, the core concepts, and how to find your way around the docs.
---

# Welcome to Aglyn

Aglyn is a no-code platform for building and running websites. You design pages
visually in the **Besigner**, bind them to your own data, and publish to a fast,
SEO-ready site — all without writing code.

These docs teach you how to actually *use* Aglyn, feature by feature. If you're new,
start with **[Getting Started](getting-started/create-a-site.md)**. If you're catching
up on what shipped recently, see **[What's New](whats-new.md)**.

```mermaid
flowchart TD
  H[Site — your website] --> S[Screens]
  H --> L[Layouts]
  H --> D[Data: datasets, variables, functions]
  H --> M[Media]
  L -. wraps .-> S
  D -. binds into .-> S
  M -. used by .-> S
  S --> P[Published site]
```

## The mental model

A few concepts show up everywhere in Aglyn. Learn these first and the rest of the
product clicks into place.

| Concept | What it is |
| --- | --- |
| **Site** | Your website — its screens, theme, data, domain, and settings. You can own more than one. |
| **Screen** | A page. Screens have a URL slug, live in a hierarchy, and are edited in the Besigner. |
| **Layout** | A shared frame (header/footer/nav) that many screens render inside via a layout **slot**. |
| **Besigner** | The visual editor. Drag components onto a canvas, arrange a hierarchy, and edit text inline. |
| **Component** | A building block on the canvas (Button, Image, Video, Form, and more). Can be made **reusable**. |
| **Binding** | A live reference in a text prop — `{{variable}}`, `{{fn:name(args)}}`, or a dataset field — resolved at render time. |
| **Dataset** | Structured content (a typed model with records) that screens read from and forms write to. |
| **Plan & entitlements** | Your subscription tier gates features and quotas (Free, Pro, Business). |

## How the docs are organized

- **[Getting Started](getting-started/create-a-site.md)** — create a site and
  publish your first screen.
- **[Concepts](concepts/glossary.md)** — the vocabulary and mental model:
  the naming conventions and the [term reference](concepts/term-reference.md).
- **[Building sites](/building-sites)** — the Besigner, screens and layouts,
  theming, bindings, languages, SEO, protection, redirects, and domains.
- **[Content & data](/content-and-data)** — datasets, media, forms, and contacts.
- **[Marketing & automation](/marketing-and-automation)** — workflows, email
  campaigns, overlays and experiments, AI assist, and analytics.
- **[Commerce & bookings](/commerce-and-bookings)** — catalog, storefront,
  orders, POS, and bookings.
- **[Workspace & billing](/workspace-and-billing)** — teams, roles, plans,
  and billing.
- **[Developers](developers/plugins/overview.md)** — build and publish
  plugins that extend the platform.
- **[What's New](whats-new.md)** — the features shipped most recently, with
  links into each area.

:::tip Plan gating
Many features are gated by your plan. Where that matters, a page starts with a callout
like the one below.
:::

:::info Plan availability
**Free** for core building. **Pro** and **Business** unlock advanced features — each page
notes what it needs.
:::

Ready? Head to **[Create your first site](getting-started/create-a-site.md)**.
