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

import { FieldComponentType } from '@aglyn/aglyn'
import { componentMapper, FormRenderer } from '@aglyn/shared-ui-jsx-forms'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { ATTRIBUTE_COMMIT_DEBOUNCE_MS } from './element-props-form.component'
import ElementStylesFormTemplate from './element-styles-form-template.component'

const schema = {
  fields: [
    {
      component: FieldComponentType.TEXT_FIELD,
      name: 'width',
      label: 'Width',
    },
  ],
}

const renderTemplate = (onSubmit: jest.Mock) =>
  render(
    <FormRenderer
      FormTemplate={ElementStylesFormTemplate}
      componentMapper={componentMapper}
      onSubmit={onSubmit}
      initialValues={{}}
      schema={schema}
    />,
  )

// One interaction model for the whole styles panel (AGL-587): every
// grouped style control applies on a short debounce, with no per-group
// "Save Element" button.
describe('ElementStylesFormTemplate (AGL-587)', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders no Save Element button', () => {
    renderTemplate(jest.fn())
    expect(screen.queryByRole('button', { name: /save element/i })).toBeNull()
  })

  it('applies an edit automatically after the debounce window', () => {
    const onSubmit = jest.fn()
    renderTemplate(onSubmit)

    fireEvent.change(screen.getByLabelText('Width'), {
      target: { value: '320px' },
    })
    expect(onSubmit).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(ATTRIBUTE_COMMIT_DEBOUNCE_MS))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ width: '320px' })
  })

  it('coalesces a typing burst into a single commit', () => {
    const onSubmit = jest.fn()
    renderTemplate(onSubmit)
    const input = screen.getByLabelText('Width')

    for (const value of ['3', '32', '320', '320p', '320px']) {
      fireEvent.change(input, { target: { value } })
    }
    act(() => jest.advanceTimersByTime(ATTRIBUTE_COMMIT_DEBOUNCE_MS))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ width: '320px' })
  })

  it('flushes the pending edit when focus leaves the field', () => {
    const onSubmit = jest.fn()
    renderTemplate(onSubmit)
    const input = screen.getByLabelText('Width')

    fireEvent.change(input, { target: { value: '50%' } })
    fireEvent.blur(input)
    // No timer advance — the blur alone must commit (AGL-567 semantics).
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ width: '50%' })
  })
})
