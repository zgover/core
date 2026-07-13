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

import { auditHostReferences } from './reference-audit'

describe('auditHostReferences', () => {
  const known = {
    workflows: new Set(['wf-1', 'Welcome flow']),
    functions: new Set(['fn-1']),
    datasets: new Set(['ds-1']),
    lists: new Set(['list-1']),
    campaigns: new Set<string>(),
    overlays: new Set(['ov-1']),
    webhooks: new Set(['hook-1']),
  }

  it('passes intact references (id or legacy name)', () => {
    expect(
      auditHostReferences({
        known,
        actions: [
          {
            $id: 'a1',
            name: 'On signup',
            trigger: { event: 'formSubmission' },
            steps: [
              { type: 'runWorkflow', workflowId: 'wf-1' },
              { type: 'runWorkflow', workflowName: 'Welcome flow' },
              { type: 'enrollList', listId: 'list-1' },
            ],
          },
        ],
      }),
    ).toEqual([])
  })

  it('flags dangling ids across step kinds', () => {
    const issues = auditHostReferences({
      known,
      actions: [
        {
          $id: 'a1',
          name: 'Broken',
          trigger: { event: 'formSubmission' },
          steps: [
            { type: 'runWorkflow', workflowId: 'wf-gone' },
            { type: 'updateDataset', datasetId: 'ds-gone' },
            { type: 'showOverlay', overlayId: 'ov-gone' },
          ],
        },
      ],
    })
    expect(issues.map((issue) => issue.refType)).toEqual([
      'workflow',
      'dataset',
      'overlay',
    ])
    expect(issues[0]).toMatchObject({
      source: 'action',
      sourceName: 'Broken',
      missing: 'wf-gone',
    })
  })

  it('flags workflow steps pointing at deleted functions', () => {
    const issues = auditHostReferences({
      known,
      workflows: [
        {
          $id: 'wf-1',
          name: 'Welcome flow',
          steps: [
            { functionId: 'fn-1', functionName: 'greet' },
            { functionId: 'fn-gone', functionName: '' },
          ],
        } as any,
      ],
    })
    expect(issues).toHaveLength(1)
    expect(issues[0].refType).toBe('function')
  })

  it('flags computed variables with dangling workflows', () => {
    const issues = auditHostReferences({
      known,
      variables: [
        { $id: 'v1', name: 'total', workflowId: 'wf-gone' } as any,
      ],
    })
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ source: 'variable', refType: 'workflow' })
  })

  it('flags dangling screen-node entity references (AGL-345)', () => {
    const issues = auditHostReferences({
      known: {
        screens: new Set(['home']),
        products: new Set(['p1']),
        collections: new Set(['c1']),
        datasets: new Set(['d1', 'Team']),
      },
      screens: [
        {
          $id: 's1',
          name: 'Shop',
          nodes: {
            a: { props: { screenId: 'gone-screen' } },
            b: { props: { productId: 'p1' } }, // resolves — no issue
            c: { props: { collectionId: 'gone-collection' } },
            d: { props: { repeatDataset: 'Team' } }, // by name — resolves
          },
        },
      ],
    })
    expect(issues).toHaveLength(2)
    expect(issues.map((issue) => issue.refType).sort()).toEqual([
      'collection',
      'screen',
    ])
    expect(issues[0]).toMatchObject({ source: 'screen', sourceName: 'Shop' })
  })

  it('flags redirect steps pointing at deleted screens', () => {
    const issues = auditHostReferences({
      known: { screens: new Set(['home']) },
      actions: [
        {
          $id: 'a1',
          name: 'Go',
          trigger: { event: 'elementClick' },
          steps: [{ type: 'redirect', screenId: 'gone' } as any],
        },
      ],
    })
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ refType: 'screen', missing: 'gone' })
  })

  it('stays quiet when a target kind is not loaded and for empty refs', () => {
    expect(
      auditHostReferences({
        known: {},
        actions: [
          {
            $id: 'a1',
            name: 'Unloaded',
            trigger: { event: 'formSubmission' },
            steps: [{ type: 'runWorkflow', workflowId: 'anything' }],
          },
        ],
        variables: [{ $id: 'v1', name: 'plain' } as any],
      }),
    ).toEqual([])
  })
})
