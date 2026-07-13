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

/**
 * Plugin scheduled jobs (AGL-435, Strapi cron parity): `/server` entries
 * register named jobs with an interval; a guarded platform runner route
 * (`/api/plugins/run-jobs`, secret header, invoked by the deployment's
 * scheduler) executes the due ones. The REGISTRY is pure — due-ness and
 * last-run persistence belong to the runner, so core stays storage-free.
 * Handlers must be idempotent and bounded (they share the API process).
 */

export interface PluginJob {
  pluginId: string
  /** Stable job name, unique within the plugin ('expire-stale-holds'). */
  name: string
  intervalMinutes: number
  description?: string
  handler: () => Promise<void> | void
}

const jobs = new Map<string, PluginJob>()

export const pluginJobKey = (job: Pick<PluginJob, 'pluginId' | 'name'>) =>
  `${job.pluginId}:${job.name}`

/** Idempotent per pluginId:name. */
export function registerPluginJob(job: PluginJob): void {
  jobs.set(pluginJobKey(job), job)
}

export function listPluginJobs(): PluginJob[] {
  return [...jobs.values()]
}

export interface PluginJobResult {
  key: string
  ok: boolean
  error?: string
}

/**
 * Runs the jobs `due` selects (default: all), sequentially with error
 * isolation — one broken job never blocks the rest.
 */
export async function runPluginJobs(
  due?: (job: PluginJob) => boolean,
): Promise<PluginJobResult[]> {
  const results: PluginJobResult[] = []
  for (const job of jobs.values()) {
    if (due && !due(job)) continue
    const key = pluginJobKey(job)
    try {
      await job.handler()
      results.push({ key, ok: true })
    } catch (error) {
      console.error(`plugin job ${key} failed:`, error)
      results.push({ key, ok: false, error: String(error) })
    }
  }
  return results
}
