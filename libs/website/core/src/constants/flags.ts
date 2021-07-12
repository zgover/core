/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

export enum EventFlag {
  INSTANCE_CREATED = 'website:app:created-instance',
  SET_MODULE = 'website:app:set-module',
  SET_COMPONENT = 'website:app:set-component',
}

export enum RestrictFlag {
  LIMIT = 'limit',
  DISALLOW = 'disallow',
}
