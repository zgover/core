import { render } from '@testing-library/react'

import WebsiteComponent from './website.component'

describe('WebsiteComponent', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WebsiteComponent />)
    expect(baseElement).toBeTruthy()
  })
})
