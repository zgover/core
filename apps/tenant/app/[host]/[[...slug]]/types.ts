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

import type * as Aglyn from '@aglyn/aglyn/server'
import type { ClientAutomation } from '../../../utils/get-client-automations'
import type { CollectionContent } from '../../../utils/get-collection-content'
import type { ScreenExperiment } from '../../../utils/get-screen-experiments'

/**
 * Composed page payload the server route hands to the client renderer
 * (unchanged from the former `getStaticProps` `Props`, AGL-398). Shared by
 * `load-page-data`, `page`, and `catch-all-client`.
 */
export interface Props {
  data: {
    host?: Aglyn.AglynHost
    screen?: {
      data?: Aglyn.AglynScreen
      version?: Aglyn.AglynScreenVersion
    }
  }
  nodes: Record<Aglyn.NodeId, Aglyn.NodeSchema> | null
  /** Free-tier "Made with Aglyn" badge (AGL-69, removeBranding gate). */
  showBranding?: boolean
  /**
   * Site-wide announcement bar (AGL-195): text already binding-resolved
   * server-side; `contentHash` keys the visitor's dismissal so edits
   * re-show the bar. Null when disabled or not entitled.
   */
  announcementBar?: {
    text: string
    href?: string
    backgroundColor?: string
    textColor?: string
    dismissible?: boolean
    contentHash: string
    /** Marketing-hub overlay doc id for per-overlay stats (AGL-271). */
    overlayId?: string
  } | null
  /**
   * Promotional popup (AGL-196): copy binding-resolved server-side; the
   * client owns trigger timing, the schedule window re-check (ISR pages
   * cache up to 60s), and localStorage frequency capping.
   */
  popup?: {
    headline?: string
    body: string
    imageUrl?: string
    ctaLabel?: string
    ctaHref?: string
    trigger: 'delay' | 'scroll' | 'exit'
    triggerValue: number
    frequencyDays: number
    collectEmail?: boolean
    startAtMs?: number
    endAtMs?: number
    contentHash: string
    /** Marketing-hub overlay doc id for per-overlay stats (AGL-271). */
    overlayId?: string
  } | null
  /**
   * Screen/section A/B experiments for this screen (AGL-253): the client
   * runner assigns a variant per visitor, swaps the composed tree, and
   * beacons exposures/conversions.
   */
  experiments?: ScreenExperiment[]
  /**
   * Site-event automations for this page (AGL-256): the client engine
   * arms triggers, runs client steps, and dispatches server steps.
   */
  clientAutomations?: ClientAutomation[]
  /** Overlay payloads referenced by showOverlay steps, by overlay id. */
  automationOverlays?: Record<
    string,
    { kind: 'bar' | 'popup'; bar?: any; popup?: any }
  > | null
  /** Collection list/entry payload when the path is content, not a screen. */
  content?: CollectionContent
  /** Password-protected screen: nodes withheld until unlock (AGL-87). */
  protectedScreen?: boolean
  /** Members-only screen (AGL-109): nodes arrive via /api/membership. */
  memberScreen?: boolean
  /** Membership form route (AGL-109): 'signin' | 'signup'. */
  membershipPage?: string
  /** Rendered as the custom not-found screen (noindex, AGL-87). */
  notFoundFallback?: boolean
  /** Maintenance mode (AGL-131): 503 screen or the built-in notice. */
  maintenanceFallback?: boolean
  /** Composed 401 screen nodes for members-only denials (AGL-131). */
  unauthorizedNodes?: Record<string, any> | null
}

/** Discriminated result of {@link Props} loading — mirrors the old
 * `getStaticProps` return shapes so the page can map them to
 * `notFound()` / `redirect()` / render. */
export type LoadResult =
  | { props: Props; revalidate?: number }
  | { notFound: true; revalidate?: number }
  | {
      redirect: { destination: string; statusCode?: number }
      revalidate?: number
    }
