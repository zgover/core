---
sidebar_position: 9
title: Responsive styling & custom CSS
description: Style per breakpoint from the artboard preview, use the box stylers, custom classes, and the CSS builder.
---

# Responsive styling & custom CSS

## Style per breakpoint

The artboard preview mode now doubles as your styling scope:

- **Fluid Responsive** (default) — style edits apply at **every** screen
  size.
- **XS / SM / MD / LG / XL** — edits in the styles panel apply **from
  that breakpoint up**, following the mobile-first cascade. Switch to
  *SM – Tablet*, change a padding, and phones keep the base value while
  tablets and up take the new one.

A chip at the top of the styles panel always shows the active scope
("Styling: all screen sizes" or "Styling breakpoint: SM"). Values you
*don't* touch keep inheriting — opening a panel at a breakpoint never
pins anything by itself.

## Box stylers

The margin/padding stylers are fully interactive:

- Pick the fan-out with **Side / Axis / All**: one side at a time, the
  vertical or horizontal pair together, or all four sides at once.
- Click any side in the box diagram to edit its value inline, or use the
  per-side fields — each with a unit menu (px, %, em, rem, vh, vw…).
- Everything respects the active breakpoint scope.

## Custom classes

Every element accepts **Classes** (chips input under *Classes & custom
CSS*). They merge into the rendered element, so you can target them from
theme styles and from [interaction class actions](interactions-and-custom-html.md).

## Custom CSS (sx)

The *Classes & custom CSS* section edits the element's `sx` in three
modes:

- **Builder** — property + value rows with grouped suggestions (layout,
  spacing, typography, background, border, effects).
- **CSS** — paste plain declarations (`border-radius: 8px;`); they parse
  into the element's styles at the active breakpoint scope.
- **JSS (sx)** — the full document as JSON, including responsive objects
  (`{ xs, md }`) and nested selectors (`"&:hover"`), for full control.

## Semantic sections & theme mode

- The **Section** component groups children inside a real HTML element —
  `section`, `article`, `aside`, `nav`, `header`, `footer`, `main`, or
  `div` — keeping your page outline meaningful for SEO and assistive
  tech.
- The **Theme mode switcher** component gives visitors a light/dark/
  device-default override that persists across visits.

## Edit JSON for one element

Right-click any element → **Edit JSON** to edit just that element and
its children as JSON (the rest of the screen is untouched). Apply
validates component ids and node ids, and the change is undoable.
