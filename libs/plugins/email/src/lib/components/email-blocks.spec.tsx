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

import { render } from '@testing-library/react'
import {
  EmailButton,
  EmailDivider,
  EmailHtml,
  EmailImage,
  EmailProduct,
  EmailRichtext,
  EmailSection,
  EmailSpacer,
  EmailText,
} from './email-blocks'

/**
 * Collects the emotion-generated CSS rules scoped to the element's classes,
 * whitespace-stripped so assertions are formatting-agnostic. Emotion inserts
 * rules via insertRule (speedy), so they only exist in the CSSOM.
 */
const emotionCssFor = (element: Element): string => {
  const classes = Array.from(element.classList)
  return Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules)
      } catch {
        return []
      }
    })
    .map((rule) => rule.cssText)
    .filter((text) => classes.some((name) => text.includes(name)))
    .join('\n')
    .replace(/\s/g, '')
}

/**
 * The styles-panel output reaches every block through props.sx (the
 * renderer's Leaf merges node.sx last so it wins). Each block must
 * compose that incoming sx AFTER its own defaults — a literal
 * `sx={{...}}` after `{...rest}` used to discard it entirely (AGL-587).
 */
describe('email blocks apply incoming node sx (AGL-587)', () => {
  it('EmailText: node sx overrides the variant preset', () => {
    const { container } = render(
      <EmailText variant="heading" sx={{ fontWeight: 400 }}>
        Hello
      </EmailText>,
    )
    const css = emotionCssFor(container.firstElementChild as Element)
    // Styles-panel value wins over the heading preset's 700.
    expect(css).toContain('font-weight:400')
    expect(css).not.toContain('font-weight:700')
    // Untouched preset values survive the merge.
    expect(css).toContain('font-size:28px')
  })

  it('EmailSection: node sx overrides the container defaults', () => {
    const { container } = render(
      <EmailSection sx={{ maxWidth: 320, backgroundColor: 'rgb(1, 2, 3)' }}>
        child
      </EmailSection>,
    )
    const css = emotionCssFor(container.firstElementChild as Element)
    expect(css).toContain('max-width:320px')
    expect(css).not.toContain('max-width:600px')
    expect(css).toContain('background-color:rgb(1,2,3)')
    // Untouched defaults survive the merge.
    expect(css).toContain('padding:24px')
  })

  // Regression sweep: every block must forward props.sx to its root —
  // the styles panel writes arbitrary keys, marginTop stands in for any.
  const blocks: Array<[string, JSX.Node]> = [
    ['EmailSection', <EmailSection sx={{ marginTop: '99px' }} />],
    ['EmailText', <EmailText sx={{ marginTop: '99px' }}>t</EmailText>],
    ['EmailRichtext (empty)', <EmailRichtext sx={{ marginTop: '99px' }} />],
    [
      'EmailRichtext (html)',
      <EmailRichtext html="<p>hi</p>" sx={{ marginTop: '99px' }} />,
    ],
    ['EmailImage', <EmailImage sx={{ marginTop: '99px' }} />],
    ['EmailButton', <EmailButton sx={{ marginTop: '99px' }}>b</EmailButton>],
    ['EmailDivider', <EmailDivider sx={{ marginTop: '99px' }} />],
    ['EmailSpacer', <EmailSpacer sx={{ marginTop: '99px' }} />],
    ['EmailProduct', <EmailProduct sx={{ marginTop: '99px' }} />],
    ['EmailHtml', <EmailHtml html="<p>hi</p>" sx={{ marginTop: '99px' }} />],
  ]

  it.each(blocks)('%s forwards sx to the rendered root', (_name, element) => {
    const { container } = render(element as any)
    const css = emotionCssFor(container.firstElementChild as Element)
    expect(css).toContain('margin-top:99px')
  })

  it('keeps block defaults when no node sx is provided', () => {
    const { container } = render(<EmailText variant="heading">Hi</EmailText>)
    const css = emotionCssFor(container.firstElementChild as Element)
    expect(css).toContain('font-weight:700')
  })
})
