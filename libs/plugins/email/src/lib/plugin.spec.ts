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

import * as Aglyn from '@aglyn/aglyn'
import { BUNDLE_ID } from './constants/bundle-common'
import { EMAIL_BUNDLE, registerEmailPlugin } from './plugin'

describe('email plugin', () => {
  it('registers the bundle once with all email blocks', () => {
    registerEmailPlugin()
    expect(Aglyn.plugins.getDependency(BUNDLE_ID)).toBeTruthy()
    expect(() => registerEmailPlugin()).not.toThrow()
    const ids = EMAIL_BUNDLE.map((entry) => entry.schema.$id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'emailSection',
        'emailText',
        'emailRichtext',
        'emailImage',
        'emailButton',
        'emailDivider',
        'emailSpacer',
        'emailProduct',
        'emailHtml',
      ]),
    )
    // Every schema carries the email bundle id.
    for (const entry of EMAIL_BUNDLE) {
      expect(entry.schema.pluginId).toBe(BUNDLE_ID)
    }
  })
})
