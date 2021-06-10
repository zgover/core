/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import { Id } from '@aglyn/shared/util/helpers'
import admin from './admin'


export function createDocumentId() {
  return Id.nanoid(10)
}

export function createTimestamp() {
  return admin.firestore.Timestamp.now()
}
