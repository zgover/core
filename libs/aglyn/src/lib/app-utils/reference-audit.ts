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

import type { HostAction } from './actions'
import type { HostVariable } from './variables'
import type { HostWorkflow } from './workflows'

/**
 * Reference-integrity audit (wave v7): id references (AGL-261) are
 * rename-safe but not delete-safe — deleting a workflow leaves actions
 * pointing at nothing, and the executors fail silently at run time.
 * This pure audit cross-checks every reference an automation, workflow,
 * or computed variable holds against the ids/names that still exist,
 * so the console can surface broken wiring before a visitor hits it.
 */
export interface ReferenceIssue {
  /** What holds the broken reference. */
  source: 'action' | 'workflow' | 'variable'
  sourceId: string
  /** Display name of the holder. */
  sourceName: string
  /** What the reference points at ("workflow", "dataset", …). */
  refType: string
  /** The dangling id or name as stored. */
  missing: string
}

export interface ReferenceAuditInput {
  actions?: Array<HostAction & { $id: string }>
  workflows?: Array<HostWorkflow & { $id: string }>
  variables?: Array<HostVariable & { $id: string }>
  /** Known-good targets: doc ids AND display names both resolve. */
  known: {
    workflows?: Set<string>
    functions?: Set<string>
    datasets?: Set<string>
    lists?: Set<string>
    campaigns?: Set<string>
    overlays?: Set<string>
    webhooks?: Set<string>
  }
}

const resolves = (
  known: Set<string> | undefined,
  id?: string,
  name?: string,
): boolean => {
  const cleanId = id?.trim()
  const cleanName = name?.trim()
  if (!cleanId && !cleanName) return true // Nothing referenced.
  if (!known) return true // Target kind not loaded — don't cry wolf.
  return Boolean(
    (cleanId && known.has(cleanId)) || (cleanName && known.has(cleanName)),
  )
}

export function auditHostReferences(
  input: ReferenceAuditInput,
): ReferenceIssue[] {
  const issues: ReferenceIssue[] = []
  const { known } = input

  for (const action of input.actions ?? []) {
    const push = (refType: string, missing: string) =>
      issues.push({
        source: 'action',
        sourceId: action.$id,
        sourceName: action.name ?? action.$id,
        refType,
        missing,
      })
    for (const step of action.steps ?? []) {
      if (step.type === 'runWorkflow') {
        if (!resolves(known.workflows, step.workflowId, step.workflowName)) {
          push('workflow', step.workflowId || step.workflowName || '')
        }
      } else if (
        step.type === 'datasetAppend' ||
        step.type === 'updateDataset'
      ) {
        if (!resolves(known.datasets, step.datasetId, step.datasetName)) {
          push('dataset', step.datasetId || step.datasetName || '')
        }
      } else if (step.type === 'enrollList') {
        if (!resolves(known.lists, step.listId, step.listName)) {
          push('list', step.listId || step.listName || '')
        }
      } else if (step.type === 'assignCampaign') {
        if (!resolves(known.campaigns, step.campaignId, step.campaignName)) {
          push('campaign', step.campaignId || step.campaignName || '')
        }
      } else if (step.type === 'showOverlay') {
        if (!resolves(known.overlays, step.overlayId, step.overlayName)) {
          push('overlay', step.overlayId || step.overlayName || '')
        }
      } else if (step.type === 'webhookPost') {
        if (!resolves(known.webhooks, step.webhookId, step.webhookName)) {
          push('webhook', step.webhookId || step.webhookName || '')
        }
      }
    }
  }

  for (const workflow of input.workflows ?? []) {
    for (const step of workflow.steps ?? []) {
      if (!resolves(known.functions, step.functionId, step.functionName)) {
        issues.push({
          source: 'workflow',
          sourceId: workflow.$id,
          sourceName: workflow.name ?? workflow.$id,
          refType: 'function',
          missing: step.functionId || step.functionName || '',
        })
      }
    }
  }

  for (const variable of input.variables ?? []) {
    if (!resolves(known.workflows, variable.workflowId, variable.workflowName)) {
      issues.push({
        source: 'variable',
        sourceId: variable.$id,
        sourceName: variable.name ?? variable.$id,
        refType: 'workflow',
        missing: variable.workflowId || variable.workflowName || '',
      })
    }
  }

  return issues
}
