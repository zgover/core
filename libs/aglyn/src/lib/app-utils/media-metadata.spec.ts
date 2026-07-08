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
  MEDIA_TAG_MAX_COUNT,
  normalizeMediaTags,
  readImageDimensions,
} from './media-metadata'

describe('normalizeMediaTags', () => {
  it('trims, lowercases, and dedupes', () => {
    expect(normalizeMediaTags(' Hero, hero , Product ')).toEqual([
      'hero',
      'product',
    ])
    expect(normalizeMediaTags(['A', 'a', ' b '])).toEqual(['a', 'b'])
  })

  it('drops empty/oversized tags and caps the count', () => {
    expect(normalizeMediaTags(['', 'x'.repeat(41)])).toEqual([])
    const many = Array.from({ length: 30 }, (_, index) => `tag${index}`)
    expect(normalizeMediaTags(many)).toHaveLength(MEDIA_TAG_MAX_COUNT)
  })
})

describe('readImageDimensions', () => {
  it('reads PNG IHDR dimensions', () => {
    const png = new Uint8Array(24)
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    png.set([0x00, 0x00, 0x02, 0x80], 16) // width 640
    png.set([0x00, 0x00, 0x01, 0xe0], 20) // height 480
    expect(readImageDimensions(png)).toEqual({ width: 640, height: 480 })
  })

  it('reads GIF little-endian dimensions', () => {
    const gif = new Uint8Array(24)
    gif.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
    gif.set([0x20, 0x00, 0x10, 0x00], 6) // 32 x 16
    expect(readImageDimensions(gif)).toEqual({ width: 32, height: 16 })
  })

  it('reads JPEG SOF0 dimensions', () => {
    // SOI, APP0 (16 bytes), SOF0 with height 480 width 640.
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11,
      0x08, 0x01, 0xe0, 0x02, 0x80, 0x03,
    ])
    expect(readImageDimensions(jpeg)).toEqual({ width: 640, height: 480 })
  })

  it('returns null for unknown or truncated data', () => {
    expect(readImageDimensions(new Uint8Array(4))).toBeNull()
    expect(readImageDimensions(new Uint8Array(32))).toBeNull()
  })
})
