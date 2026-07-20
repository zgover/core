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

// The docs Vercel project deploys from apps/docs; the canonical domain lives
// in apps/docs/docusaurus.config.ts — keep the two in sync.
export const DOCS_BASE_URL = (
  process.env.NEXT_PUBLIC_AGLYN_DOCS_URL || 'https://docs.aglyn.com'
).replace(/\/+$/, '')

/** Absolute docs URL for a docs-site path (docs serve from the site root). */
export function buildDocsUrl(path = '/'): string {
  return `${DOCS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export interface DocsHelpTopic {
  /** Docs-site path, e.g. `/content-and-data/media/overview`. */
  path: string
  /** Human title matching the docs page title. */
  title: string
  /** Excerpt shown in the help tooltip — keep verbatim from the docs page's
   * frontmatter `description` so console copy never drifts from the docs. */
  excerpt: string
}

// Keys are console feature ids; paths/excerpts mirror apps/docs frontmatter.
export const DOCS_HELP_TOPICS = {
  consoleTour: {
    path: '/getting-started/console-tour',
    title: 'The console tour',
    excerpt:
      'Where things live in the Aglyn console app bar and navigation.',
  },
  gettingStarted: {
    path: '/getting-started/create-a-site',
    title: 'Create a site',
    excerpt:
      'Sign in, create your first site, and understand what a site contains.',
  },
  screens: {
    path: '/building-sites/screens-and-layouts/overview',
    title: 'Screens & Layouts',
    excerpt:
      'Screen hierarchy and routing, shared layouts, reusable components, and versioning.',
  },
  besigner: {
    path: '/building-sites/besigner/overview',
    title: 'The Besigner',
    excerpt:
      "Aglyn's visual editor — canvas, hierarchy, inline text, multi-select, and placement rules.",
  },
  components: {
    path: '/building-sites/besigner/reusable-components',
    title: 'Reusable components',
    excerpt:
      'Promote a subtree into a reusable component and insert instances across screens.',
  },
  interactions: {
    path: '/building-sites/besigner/interactions-and-custom-html',
    title: 'Interactions & custom HTML',
    excerpt:
      'Build element interactions in one dialog and drop sanitized custom markup anywhere.',
  },
  themeBuilder: {
    path: '/building-sites/theme-builder/overview',
    title: 'Theme Builder',
    excerpt:
      "Set your site's colors, fonts, and light/dark schemes with a live preview.",
  },
  content: {
    path: '/building-sites/site-templates/overview',
    title: 'Templates, Blocks & Content',
    excerpt:
      'Start from templates, drop in pre-built sections and blocks, and publish a blog with collections.',
  },
  media: {
    path: '/content-and-data/media/overview',
    title: 'Media Library & CDN',
    excerpt:
      'Organize images, video, and files in folders, transform them, and serve them fast over a CDN.',
  },
  datasets: {
    path: '/content-and-data/datasets/overview',
    title: 'Datasets & Dynamic Content',
    excerpt:
      'Model structured content with typed fields and relations, then bind it into repeatable components.',
  },
  contacts: {
    path: '/content-and-data/contacts/overview',
    title: 'Contacts CRM',
    excerpt:
      'A unified contacts list ingested from forms, members, orders, and bookings — with tags, notes, and segments.',
  },
  forms: {
    path: '/content-and-data/forms/overview',
    title: 'Forms & Lead Capture',
    excerpt:
      'Add forms to your site, collect submissions in an inbox, and write them into datasets.',
  },
  plugins: {
    path: '/developers/plugins/overview',
    title: 'Plugins & Marketplace',
    excerpt:
      'Extend Aglyn with sandboxed plugins — install from the marketplace, configure them, and publish your own.',
  },
  billing: {
    path: '/workspace-and-billing/billing-and-plans/overview',
    title: 'Billing & Plans',
    excerpt:
      "How Aglyn's tiers, entitlements, quotas, usage meters, and seat add-ons work.",
  },
  team: {
    path: '/workspace-and-billing/teams-and-roles/overview',
    title: 'Teams, Roles & Membership',
    excerpt:
      "Invite teammates with custom roles, and offer members-only areas to your site's visitors.",
  },
  members: {
    path: '/guides/member-accounts',
    title: 'Member accounts',
    excerpt:
      'Let visitors sign up on your site, gate screens to members, and manage members from the console Users page.',
  },
  analytics: {
    path: '/marketing-and-automation/analytics/overview',
    title: 'Analytics',
    excerpt:
      'Built-in pageview analytics, traffic insights, and per-screen metrics.',
  },
  emailCampaigns: {
    path: '/marketing-and-automation/email-campaigns/overview',
    title: 'Email Campaigns',
    excerpt:
      'Send email to audiences built from your contacts, with tiered send caps and unsubscribe handling.',
  },
  workflows: {
    path: '/marketing-and-automation/workflows-and-actions/overview',
    title: 'Workflows, Actions & Webhooks',
    excerpt:
      'Automate your site — run multi-step workflows on site events, and connect to other systems with webhooks.',
  },
  commerce: {
    path: '/commerce-and-bookings/commerce/overview',
    title: 'Commerce',
    excerpt:
      'Sell physical, digital, and service products with a full catalog, orders pipeline, shipping, taxes, and your own Stripe account.',
  },
  pos: {
    path: '/commerce-and-bookings/commerce/pos-and-reservations',
    title: 'POS & reservations',
    excerpt:
      'Sell in person from the console register and take date-range reservations with deposits.',
  },
  bookings: {
    path: '/commerce-and-bookings/bookings/overview',
    title: 'Bookings & Scheduling',
    excerpt:
      'Offer services with availability, let visitors book, take payment, and send reminders.',
  },
  customDomains: {
    path: '/building-sites/custom-domains/overview',
    title: 'Custom Domains',
    excerpt:
      'Connect your own domain with a self-service wizard and DNS verification.',
  },
  redirects: {
    path: '/building-sites/redirects/overview',
    title: 'Redirects',
    excerpt:
      'Manage URL redirects with validation, loop detection, and hit metrics.',
  },
  account: {
    path: '/workspace-and-billing/signing-in-and-sessions',
    title: 'Signing In & Sessions',
    excerpt:
      'How console sign-in works — one session across all your workspaces, and automatic sign-out after inactivity.',
  },
  staffConsole: {
    path: '/staff-console/overview',
    title: 'Staff Console (internal)',
    excerpt:
      'Aglyn-staff tools for managing organizations, entitlements, users, and audits.',
  },
  featureFlags: {
    path: '/staff-console/feature-flags',
    title: 'Feature Flags',
    excerpt:
      'Release-gate console features with Firebase Remote Config — staff always see everything, customers see what is launched.',
  },
  marketingOverlays: {
    path: '/marketing-and-automation/marketing-overlays/overview',
    title: 'Marketing Overlays',
    excerpt:
      'Site-wide announcement bars and promotional popups with triggers, scheduling, and email capture.',
  },
  dragDropHierarchy: {
    path: '/building-sites/besigner/drag-drop-hierarchy',
    title: 'Drag-and-drop hierarchy',
    excerpt:
      'Everything drag-and-drop in the Besigner — where you can drag, how drop zones and placement markers work, containers vs. leaf elements, placement rules, and multi-drag.',
  },
  multiSelect: {
    path: '/building-sites/besigner/multi-select',
    title: 'Multi-select & multi-drag',
    excerpt:
      'Select several elements at once and move the whole selection together.',
  },
  responsiveStyling: {
    path: '/building-sites/besigner/responsive-styling',
    title: 'Responsive styling & custom CSS',
    excerpt:
      'Style per breakpoint from the artboard preview, use the box stylers, custom classes, and the CSS builder.',
  },
  textEditing: {
    path: '/building-sites/besigner/text-editing',
    title: 'Inline & rich text editing',
    excerpt:
      'Edit text directly on the canvas, with basic rich text on opt-in elements.',
  },
  bindings: {
    path: '/building-sites/bindings/overview',
    title: 'Bindings, Variables & Functions',
    excerpt:
      'Live values in your content — typed variables, no-code functions, and rename-safe id tokens.',
  },
  connectADomain: {
    path: '/building-sites/custom-domains/connect-a-domain',
    title: 'Connect a domain',
    excerpt:
      'Point your own domain at your Aglyn site with a CNAME and DNS verification.',
  },
  domainTroubleshooting: {
    path: '/building-sites/custom-domains/troubleshooting',
    title: 'Troubleshoot verification',
    excerpt:
      "Fix the common reasons a custom domain won't verify.",
  },
  menusAndNavigation: {
    path: '/building-sites/menus-and-navigation/overview',
    title: 'Menus & navigation',
    excerpt:
      'Dropdown menus, hover mega menus, and slide-in drawers — authorable entirely in the besigner.',
  },
  addALocale: {
    path: '/building-sites/multilingual/add-a-locale',
    title: 'Add a locale',
    excerpt:
      'Create a language variant of your site and translate its screens.',
  },
  languageSwitcher: {
    path: '/building-sites/multilingual/language-switcher',
    title: 'Add a language switcher',
    excerpt:
      "Let visitors move between your site's locales.",
  },
  multilingual: {
    path: '/building-sites/multilingual/overview',
    title: 'Multilingual',
    excerpt:
      'Offer your site in multiple languages with locale variants, hreflang, and a language switcher.',
  },
  createARedirect: {
    path: '/building-sites/redirects/create-a-redirect',
    title: 'Create a redirect',
    excerpt:
      'Add a redirect rule and read its hit metrics.',
  },
  migrationPatterns: {
    path: '/building-sites/redirects/migration-patterns',
    title: 'Migration patterns',
    excerpt:
      'Common redirect setups when you rename screens or move a site into Aglyn.',
  },
  seo: {
    path: '/building-sites/seo/overview',
    title: 'SEO Toolkit',
    excerpt:
      'Per-screen SEO, sitemap and robots, Open Graph/Twitter cards, and structured data.',
  },
  errorScreens: {
    path: '/building-sites/site-protection/error-screens',
    title: 'Design custom error screens',
    excerpt:
      'Replace generic 404/401/403/503 pages with branded screens you design.',
  },
  maintenanceMode: {
    path: '/building-sites/site-protection/maintenance-mode',
    title: 'Maintenance mode',
    excerpt:
      'Temporarily take your site offline behind a designed 503 screen.',
  },
  siteProtection: {
    path: '/building-sites/site-protection/overview',
    title: 'Site Protection & Error Pages',
    excerpt:
      'Password-protect screens, design custom error pages, and put your site in maintenance mode.',
  },
  passwordAScreen: {
    path: '/building-sites/site-protection/password-a-screen',
    title: 'Password-protect a screen',
    excerpt:
      'Require a password to view a specific screen.',
  },
  addSearch: {
    path: '/building-sites/site-search/add-search',
    title: 'Add search to your site',
    excerpt:
      'Give visitors a search box that finds pages and dataset records.',
  },
  siteSearch: {
    path: '/building-sites/site-search/overview',
    title: 'Site Search',
    excerpt:
      "Let visitors search your site's pages and dataset records.",
  },
  buildABlog: {
    path: '/building-sites/site-templates/build-a-blog',
    title: 'Build a blog',
    excerpt:
      'Create a collection, publish rich entries, and design the list and entry pages with template screens.',
  },
  saveATemplate: {
    path: '/building-sites/site-templates/save-a-template',
    title: 'Save & share a template',
    excerpt:
      'Turn a site into a reusable template and install community templates.',
  },
  editYourTheme: {
    path: '/building-sites/theme-builder/edit-your-theme',
    title: 'Edit your theme',
    excerpt:
      'Set colors, fonts, and light/dark schemes with a live preview.',
  },
  commerceCatalog: {
    path: '/commerce-and-bookings/commerce/catalog',
    title: 'Product catalog',
    excerpt:
      'Products with options and variants, categories, tags, and manual or smart collections.',
  },
  glossary: {
    path: '/concepts/glossary',
    title: 'Glossary & naming conventions',
    excerpt:
      'What organization, workspace, tenant, host, and site each mean — and which word to use where.',
  },
  termReference: {
    path: '/concepts/term-reference',
    title: 'Term reference',
    excerpt:
      'Every term Aglyn uses, in one place — brief definitions with links to the full documentation for each.',
  },
  importExport: {
    path: '/content-and-data/datasets/import-export',
    title: 'Import & export',
    excerpt:
      'Round-trip dataset records through CSV and JSON with validation on import.',
  },
  modelBuilder: {
    path: '/content-and-data/datasets/model-builder',
    title: 'Build a data model',
    excerpt:
      'Define a dataset model with typed fields and edit records in the typed editor.',
  },
  datasetRelations: {
    path: '/content-and-data/datasets/relations',
    title: 'Relations',
    excerpt:
      'Link records together with reference fields, including many-to-many.',
  },
  buildingFeaturePlugins: {
    path: '/developers/plugins/building-feature-plugins',
    title: 'Building feature plugins',
    excerpt:
      'The console-extension + frontend-UI plugin pair pattern for shipping features as plugins.',
  },
  consoleAndSite: {
    path: '/developers/plugins/guides/console-and-site',
    title: 'Guide: console extensions & site surfaces',
    excerpt:
      'Task-ordered recipes for nav/pages/widgets/providers and canvas components/site runtimes.',
  },
  pluginExamples: {
    path: '/developers/plugins/guides/examples',
    title: 'Worked examples',
    excerpt:
      'Where to look for a working example of each plugin pattern.',
  },
  firstPlugin: {
    path: '/developers/plugins/guides/first-plugin',
    title: 'Build your first plugin',
    excerpt:
      'The full loop — scaffold, develop against a live workspace, verify, publish, install, uninstall.',
  },
  realmBundles: {
    path: '/developers/plugins/guides/realm-bundles',
    title: 'Guide: trusted realm bundles',
    excerpt:
      'The end-to-end path from a standalone bundle to first-party-grade code running in the app realm.',
  },
  serverApis: {
    path: '/developers/plugins/guides/server-apis',
    title: 'Guide: server APIs, webhooks & jobs',
    excerpt:
      'Plugin API routes behind the dispatchers, Stripe/Svix signature verification, billing hooks, and scheduled jobs.',
  },
  publishAPlugin: {
    path: '/developers/plugins/publish-a-plugin',
    title: 'Publish a plugin',
    excerpt:
      'Ship your own plugin to the community marketplace with version pinning.',
  },
  publisherHandbook: {
    path: '/developers/plugins/publishing/publisher-handbook',
    title: 'Publisher handbook',
    excerpt:
      'Publishing to the Aglyn marketplace — from profile setup through listing authoring, review, updates, and getting paid.',
  },
  extensionPoints: {
    path: '/developers/plugins/reference/extension-points',
    title: 'Extension-point catalog',
    excerpt:
      'Every surface a plugin can extend, when it runs, and which part of Aglyn it reaches.',
  },
  injectionZones: {
    path: '/developers/plugins/reference/injection-zones',
    title: 'Injection zones',
    excerpt:
      'Every named console zone a plugin widget can render into, and what each receives.',
  },
  manifestAndEnvs: {
    path: '/developers/plugins/reference/manifest-and-envs',
    title: 'Manifests, trust lifecycle & environment',
    excerpt:
      'The plugin manifest schema, the marketplace listing/version documents, the trust state machine, and every PLUGIN_* environment variable.',
  },
  pluginManagerApi: {
    path: '/developers/plugins/reference/plugin-manager-api',
    title: 'Plugin-manager API reference',
    excerpt:
      'Every public registration and loading API a plugin can use, from `@aglyn/aglyn` and `@aglyn/aglyn/server`.',
  },
  publishYourFirstScreen: {
    path: '/getting-started/publish-your-first-screen',
    title: 'Publish your first screen',
    excerpt:
      'Create a screen, design it in the Besigner, and publish it live.',
  },
  buildAndPublishASurvey: {
    path: '/guides/build-and-publish-a-survey',
    title: 'Build & publish a survey',
    excerpt:
      'Create a dataset with a typed schema, design a survey form with dropdowns, radios, checkboxes, and a star rating, publish it, and watch responses arrive.',
  },
  commerceEndToEnd: {
    path: '/guides/commerce-end-to-end',
    title: 'Commerce end to end',
    excerpt:
      'Create products with billing modes, design the storefront with Commerce blocks, take Stripe checkout for one-time and subscription sales, and run orders from the console.',
  },
  datasetsAndSchema: {
    path: '/guides/datasets-and-schema',
    title: 'Datasets & schema deep-dive',
    excerpt:
      'Field ids vs display names, the typed model, per-plan record quotas, import/export, repeatables with item bindings, and every writer that can append records.',
  },
  megaMenuWithInteractions: {
    path: '/guides/mega-menu-with-interactions',
    title: 'Build a mega menu with hover interactions',
    excerpt:
      'Add a SaaS-style mega menu to your nav bar, fill it with columns of links, and make it open on hover — entirely in the Besigner, on any plan.',
  },
  copyAssist: {
    path: '/marketing-and-automation/ai-assist/copy-assist',
    title: 'Copy assist',
    excerpt:
      'Generate and rewrite text for any canvas text prop with AI.',
  },
  generateSection: {
    path: '/marketing-and-automation/ai-assist/generate-section',
    title: 'AI Generate Section',
    excerpt:
      'Produce a whole section of components on the canvas from a prompt.',
  },
  aiAssist: {
    path: '/marketing-and-automation/ai-assist/overview',
    title: 'AI Assist',
    excerpt:
      'Generate and rewrite copy, and build whole sections, with AI inside the Besigner.',
  },
  designedEmails: {
    path: '/marketing-and-automation/email-campaigns/designed-emails',
    title: 'Designed emails',
    excerpt:
      'Build campaign emails in the besigner with email-safe blocks and merge tokens — no separate editor.',
  },
  actionsBuilder: {
    path: '/marketing-and-automation/workflows-and-actions/actions-builder',
    title: 'Actions builder',
    excerpt:
      'Map a single event to a single action without building a full workflow.',
  },
  buildAWorkflow: {
    path: '/marketing-and-automation/workflows-and-actions/build-a-workflow',
    title: 'Build a workflow',
    excerpt:
      'Create a multi-step workflow that runs when a site event fires.',
  },
  webhooks: {
    path: '/marketing-and-automation/workflows-and-actions/webhooks',
    title: 'Webhooks',
    excerpt:
      'Connect Aglyn to other systems with outbound and inbound webhooks.',
  },
  architectureMultiTenancy: {
    path: '/staff-console/architecture-multi-tenancy',
    title: 'Architecture: Multi-Tenant Organizations',
    excerpt:
      'How Aglyn organizes tenants — org workspaces, membership with per-site access, security rules, subdomains, and billing attribution.',
  },
  addOns: {
    path: '/workspace-and-billing/billing-and-plans/add-ons',
    title: 'Add-ons',
    excerpt:
      'Buy extra seats, sites, datasets, POS registers, and the Event Calendar from the Billing page — prorated, self-serve, no support ticket.',
  },
  downgradingAndCanceling: {
    path: '/workspace-and-billing/billing-and-plans/downgrading-and-canceling',
    title: 'Downgrading, canceling & your data',
    excerpt:
      'What happens to your sites, files, and data when you downgrade, cancel, or delete — and how to export first.',
  },
  customRoles: {
    path: '/workspace-and-billing/teams-and-roles/custom-roles',
    title: 'Custom roles & permissions',
    excerpt:
      'Define roles with unique permission sets and fine-tune access per member.',
  },
  inviteTeammates: {
    path: '/workspace-and-billing/teams-and-roles/invite-teammates',
    title: 'Invite teammates',
    excerpt:
      'Add people to your site and understand how team members act within your organization.',
  },
  membersOnly: {
    path: '/workspace-and-billing/teams-and-roles/members-only',
    title: 'Members-only areas',
    excerpt:
      'Let visitors sign up as members and gate screens so only members can view them.',
  },
} as const satisfies Record<string, DocsHelpTopic>

export type DocsHelpTopicKey = keyof typeof DOCS_HELP_TOPICS

export interface DocsHelpOverrides {
  /** Heading anchor on the topic's docs page, e.g. `#model-builder`. */
  anchor?: `#${string}`
  /** Override the tooltip title (defaults to the topic's docs page title). */
  title?: string
  /** Override the tooltip excerpt (defaults to the topic's docs excerpt). */
  excerpt?: string
}

/**
 * Resolve a registry topic (plus optional heading anchor and copy overrides)
 * into the `HelpTipContent` shape the shared UI help affordances accept
 * (AGL-600/601). Anchors are validated against the docs headings by
 * `docs-links.spec.ts`.
 */
export function docsHelp(
  topic: DocsHelpTopicKey,
  overrides: DocsHelpOverrides = {},
): { title: string; excerpt: string; href: string } {
  const { path, title, excerpt } = DOCS_HELP_TOPICS[topic]
  return {
    title: overrides.title ?? title,
    excerpt: overrides.excerpt ?? excerpt,
    href: `${buildDocsUrl(path)}${overrides.anchor ?? ''}`,
  }
}
