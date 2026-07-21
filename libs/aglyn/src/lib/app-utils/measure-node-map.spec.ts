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
import {
  formatBytes,
  measureNodeMap,
  NODE_MAP_MAX_BYTES,
  NODE_MAP_WARN_BYTES,
} from './measure-node-map'

/** A node whose props carry roughly `size` bytes of string payload. */
function fatNode(size: number) {
  return { componentId: 'image', props: { src: 'x'.repeat(size) } }
}

describe('measureNodeMap (AGL-678)', () => {
  it('reports a small map as neither near nor over the limit', () => {
    const result = measureNodeMap({ a: { componentId: 'box' } })
    expect(result.bytes).toBeGreaterThan(0)
    expect(result.nearLimit).toBe(false)
    expect(result.tooLarge).toBe(false)
  })

  it('warns past the warn threshold but still allows the save', () => {
    const result = measureNodeMap({ a: fatNode(NODE_MAP_WARN_BYTES + 5_000) })
    expect(result.nearLimit).toBe(true)
    expect(result.tooLarge).toBe(false)
  })

  it('refuses past the max threshold', () => {
    const result = measureNodeMap({ a: fatNode(NODE_MAP_MAX_BYTES + 5_000) })
    expect(result.tooLarge).toBe(true)
    // Mutually exclusive — a refused save is not also "near the limit".
    expect(result.nearLimit).toBe(false)
  })

  /**
   * The actionable half. "Your page is too big" is useless; "this image
   * node is 800 KB" is something a person can fix, and in practice one
   * inlined data URI is the cause rather than a thousand ordinary nodes.
   */
  it('names the biggest nodes, largest first', () => {
    const result = measureNodeMap({
      small: { componentId: 'box' },
      huge: fatNode(50_000),
      medium: fatNode(10_000),
    })
    expect(result.largest[0].id).toBe('huge')
    expect(result.largest[1].id).toBe('medium')
    expect(result.largest[0].bytes).toBeGreaterThan(result.largest[1].bytes)
  })

  it('treats an absent map as empty rather than throwing', () => {
    expect(measureNodeMap(undefined).bytes).toBe(0)
    expect(measureNodeMap(null).tooLarge).toBe(false)
  })

  /**
   * Measuring must never be the thing that blocks a save. Content the
   * encoder cannot handle is a different failure, and the write should
   * surface it rather than this reporting a phantom size problem.
   */
  it('degrades to "no opinion" when the content cannot be encoded', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    const result = measureNodeMap({ a: cyclic })
    expect(result.tooLarge).toBe(false)
  })
})

describe('formatBytes', () => {
  it('scales the unit to the size', () => {
    expect(formatBytes(512)).toBe('512 bytes')
    expect(formatBytes(20_480)).toBe('20 KB')
    expect(formatBytes(1_048_576)).toBe('1.0 MB')
  })
})
