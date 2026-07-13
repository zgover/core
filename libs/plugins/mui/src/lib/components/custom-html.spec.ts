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

import { sanitizeCustomHtml } from './custom-html'

describe('sanitizeCustomHtml (AGL-320)', () => {
  it('keeps benign markup', () => {
    expect(sanitizeCustomHtml('<p class="x"><b>hi</b></p>')).toBe(
      '<p class="x"><b>hi</b></p>',
    )
  })
  it('strips scripts, iframes, and handler attributes', () => {
    expect(sanitizeCustomHtml('<script>alert(1)</script><p>ok</p>')).toBe(
      '<p>ok</p>',
    )
    expect(sanitizeCustomHtml('<iframe src="https://x"></iframe>')).toBe('')
    expect(sanitizeCustomHtml('<img src=x onerror=alert(1)>')).toBe(
      '<img src="x">',
    )
    expect(
      sanitizeCustomHtml('<a href="javascript:alert(1)">x</a>'),
    ).toBe('<a>x</a>')
    expect(sanitizeCustomHtml('<form action="/steal"><input></form>')).not.toMatch(
      /<form/,
    )
  })
})
