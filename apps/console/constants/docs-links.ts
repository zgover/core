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
} as const satisfies Record<string, DocsHelpTopic>

export type DocsHelpTopicKey = keyof typeof DOCS_HELP_TOPICS
