# Contextual help registry

The console's contextual help — the `?` affordances on page titles, cards,
form fields, table headers, and the Besigner's style/attribute panels — is
driven by a **generated registry** sourced from the docs site
(`apps/docs/docs`). This keeps the tooltip copy and the "Open documentation"
deep links from drifting away from the docs themselves (AGL-599..602).

## The pieces

| File | Role |
| --- | --- |
| `tools/scripts/generate-docs-help.mjs` | Generator. Scans docs frontmatter + headings, emits the two generated files below. Source of truth for keys/aliases. |
| `apps/console/constants/docs-help.generated.ts` | **Generated.** `DOCS_HELP_TOPICS` (every feature page) + `DOCS_HELP_ANCHORS` (per-topic heading slugs) + `DocsHelpAnchor<K>` type. |
| `apps/console/constants/docs-links.ts` | Hand-written. `DOCS_BASE_URL`, `buildDocsUrl`, and the `docsHelp(topic, { anchor })` resolver. Re-exports the generated types. |
| `libs/besigner/feature/designer/src/lib/utils/docs-help.generated.ts` | **Generated.** The besigner subset (`BESIGNER_DOCS` + anchors) — the designer lib can't import console constants. |
| `libs/besigner/feature/designer/src/lib/utils/docs-help.ts` | Hand-written. The `besignerDocsUrl(page, anchor)` builder. |
| `apps/console/constants/docs-links.spec.ts` | The freshness gate + structural checks (runs the generator with `--check`). |

`HelpTip` (the shared UI affordance) and the `help` slots on `CardDisplay`,
the jsx-forms field mapper, and `withColumnHelp` live in `libs/shared/ui/*` and
are content-agnostic — they render whatever `HelpTipContent` you hand them.

## How content stays in sync

- **Excerpt** = the docs page's frontmatter `description`, verbatim.
- **Title** = the docs page's frontmatter `title`.
- **Anchors** = every `##`/`###`/`####` heading on the page, slugified the same
  way Docusaurus does (lowercase, strip punctuation, every space → `-`, so
  `## A & B` → `#a--b`).

Because `docsHelp`/`besignerDocsUrl` type the `anchor` argument to that page's
real heading slugs (`DocsHelpAnchor<K>`), **a renamed or removed heading turns
every stale call site into a TypeScript error** once you regenerate — you can't
ship a dead in-app deep link.

## Keys

Each docs page gets one stable registry key:

- **Auto-derived** from the path: an `…/overview` page uses its parent folder
  (`/content-and-data/media/overview` → `media`); any other page uses its file
  name (`…/add-ons` → `addOns`).
- **Aliased** when a friendly call-site key differs from the auto rule. The
  aliases live in `CONSOLE_ALIASES` (and `BESIGNER_TOPICS`) in the generator —
  e.g. `billing` → `/workspace-and-billing/billing-and-plans/overview`.

A key collision (two pages deriving the same key) **fails generation** with a
message telling you to add an alias. Keep aliases minimal — only for keys that
call sites actually use.

## Everyday workflows

**Add a docs page** → it becomes an available topic automatically on the next
generate. Give it a friendly key only if a call site wants one (add an alias).

**Edit a page's title/description/headings** → regenerate:

```bash
npm run generate:docs-help
```

**Use help at a call site:**

```tsx
// A card:
<CardDisplay header="Billing" help={docsHelp('billing', { anchor: '#usage-meters' })} />

// A page (via DashboardLayout): help="billing"

// A besigner panel:
href={besignerDocsUrl('responsiveStyling', '#box-stylers')}
```

The editor autocompletes valid anchors per topic, and an invalid one won't
compile.

## CI

`npm run generate:docs-help:check` (also run as part of `nx test console` via
the spec) fails if the generated files are stale relative to `apps/docs`. If CI
flags it, run `npm run generate:docs-help` and commit the result.
