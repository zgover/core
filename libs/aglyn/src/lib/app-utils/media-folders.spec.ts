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
  folderDepth,
  isSiblingNameTaken,
  MEDIA_FOLDER_MAX_DEPTH,
  normalizeFolderName,
  planLegacyFolderMigration,
  wouldCreateCycle,
} from './media-folders'

describe('normalizeFolderName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeFolderName('  Hero   Images ')).toBe('Hero Images')
  })

  it('rejects empty and oversized names', () => {
    expect(normalizeFolderName('   ')).toBeNull()
    expect(normalizeFolderName('x'.repeat(61))).toBeNull()
  })
})

describe('folderDepth', () => {
  const folders = {
    a: { name: 'A', parentId: null },
    b: { name: 'B', parentId: 'a' },
    c: { name: 'C', parentId: 'b' },
  }

  it('counts the parent chain', () => {
    expect(folderDepth('a', folders)).toBe(1)
    expect(folderDepth('c', folders)).toBe(3)
  })

  it('terminates on cycles at max depth', () => {
    const cyclic = {
      a: { name: 'A', parentId: 'b' },
      b: { name: 'B', parentId: 'a' },
    }
    expect(folderDepth('a', cyclic)).toBe(MEDIA_FOLDER_MAX_DEPTH)
  })
})

describe('wouldCreateCycle', () => {
  const folders = {
    a: { name: 'A', parentId: null },
    b: { name: 'B', parentId: 'a' },
    c: { name: 'C', parentId: 'b' },
  }

  it('refuses moving a folder under itself or a descendant', () => {
    expect(wouldCreateCycle('a', 'a', folders)).toBe(true)
    expect(wouldCreateCycle('a', 'c', folders)).toBe(true)
  })

  it('allows legal moves', () => {
    expect(wouldCreateCycle('c', 'a', folders)).toBe(false)
    expect(wouldCreateCycle('c', null, folders)).toBe(false)
  })
})

describe('isSiblingNameTaken', () => {
  const folders = [
    { $id: 'a', name: 'Hero', parentId: null },
    { $id: 'b', name: 'products', parentId: null },
    { $id: 'c', name: 'Hero', parentId: 'b' },
  ]

  it('matches case-insensitively within the same parent only', () => {
    expect(isSiblingNameTaken('hero', null, folders)).toBe(true)
    expect(isSiblingNameTaken('hero', 'b', folders)).toBe(true)
    expect(isSiblingNameTaken('hero', 'a', folders)).toBe(false)
  })

  it('excludes the folder being renamed', () => {
    expect(isSiblingNameTaken('Hero', null, folders, 'a')).toBe(false)
  })
})

describe('planLegacyFolderMigration', () => {
  it('creates one root folder per distinct legacy string and assigns docs', () => {
    const plan = planLegacyFolderMigration(
      [
        { $id: 'm1', folder: 'Hero' },
        { $id: 'm2', folder: ' hero ' },
        { $id: 'm3', folder: 'Products' },
        { $id: 'm4' },
        { $id: 'm5', folder: 'Hero', folderId: 'existing' },
      ],
      [],
    )
    expect(plan.foldersToCreate).toEqual(['Hero', 'Products'])
    expect(plan.assignments).toHaveLength(3)
    expect(plan.assignments.map((a) => a.mediaId)).toEqual(['m1', 'm2', 'm3'])
  })

  it('reuses existing root folders case-insensitively', () => {
    const plan = planLegacyFolderMigration(
      [{ $id: 'm1', folder: 'hero' }],
      [{ $id: 'f1', name: 'Hero', parentId: null }],
    )
    expect(plan.foldersToCreate).toEqual([])
    expect(plan.assignments).toEqual([{ mediaId: 'm1', folderName: 'hero' }])
  })
})
