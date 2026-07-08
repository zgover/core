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
 * Asset metadata helpers (AGL-173): tag normalization shared by the
 * console editor and any future API validation, plus a dependency-free
 * image header parser so the upload route can stamp dimensions without
 * pulling in an image library.
 */

export const MEDIA_TAG_MAX_COUNT = 20
export const MEDIA_TAG_MAX_LENGTH = 40
export const MEDIA_ALT_MAX_LENGTH = 300

/**
 * Trim, lowercase, dedupe, and cap tags. Accepts a comma-separated string
 * or an array; empty and oversized entries are dropped.
 */
export function normalizeMediaTags(input: string | string[]): string[] {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(',')
  const seen = new Set<string>()
  const tags: string[] = []
  for (const entry of raw) {
    const tag = String(entry ?? '').trim().toLowerCase()
    if (!tag || tag.length > MEDIA_TAG_MAX_LENGTH || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
    if (tags.length >= MEDIA_TAG_MAX_COUNT) break
  }
  return tags
}

export interface ImageDimensions {
  width: number
  height: number
}

const readU32BE = (bytes: Uint8Array, offset: number) =>
  (bytes[offset] << 24) |
  (bytes[offset + 1] << 16) |
  (bytes[offset + 2] << 8) |
  bytes[offset + 3]

const readU16BE = (bytes: Uint8Array, offset: number) =>
  (bytes[offset] << 8) | bytes[offset + 1]

const readU16LE = (bytes: Uint8Array, offset: number) =>
  bytes[offset] | (bytes[offset + 1] << 8)

/**
 * Reads pixel dimensions from PNG, JPEG, GIF, and WebP headers. Returns
 * null for anything unrecognized or truncated — callers treat dimensions
 * as best-effort metadata, never a gate.
 */
export function readImageDimensions(
  bytes: Uint8Array,
): ImageDimensions | null {
  if (bytes.length < 24) return null

  // PNG: 8-byte signature, IHDR width/height at offsets 16/20.
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const width = readU32BE(bytes, 16)
    const height = readU32BE(bytes, 20)
    return width > 0 && height > 0 ? { width, height } : null
  }

  // GIF87a/GIF89a: little-endian dimensions at offsets 6/8.
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    const width = readU16LE(bytes, 6)
    const height = readU16LE(bytes, 8)
    return width > 0 && height > 0 ? { width, height } : null
  }

  // JPEG: scan segments for a SOFn marker (C0–CF except C4/C8/CC).
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = bytes[offset + 1]
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2
        continue
      }
      const length = readU16BE(bytes, offset + 2)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const height = readU16BE(bytes, offset + 5)
        const width = readU16BE(bytes, offset + 7)
        return width > 0 && height > 0 ? { width, height } : null
      }
      if (length < 2) return null
      offset += 2 + length
    }
    return null
  }

  // WebP: RIFF....WEBP then VP8/VP8L/VP8X chunk.
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    const chunk = String.fromCharCode(
      bytes[12],
      bytes[13],
      bytes[14],
      bytes[15],
    )
    if (chunk === 'VP8X' && bytes.length >= 30) {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16))
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16))
      return { width, height }
    }
    if (chunk === 'VP8 ' && bytes.length >= 30) {
      const width = readU16LE(bytes, 26) & 0x3fff
      const height = readU16LE(bytes, 28) & 0x3fff
      return width > 0 && height > 0 ? { width, height } : null
    }
    if (chunk === 'VP8L' && bytes.length >= 25) {
      const bits =
        bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
      const width = (bits & 0x3fff) + 1
      const height = ((bits >> 14) & 0x3fff) + 1
      return { width, height }
    }
  }

  return null
}
