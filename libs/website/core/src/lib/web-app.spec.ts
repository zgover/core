/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import { WebApp, webApp } from './web-app'


describe('web-app', () => {
  it('should work', () => {
    expect(webApp).toBeInstanceOf(WebApp)
  })
})
