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

import type { HostTheme } from '@aglyn/shared-data-types'
import { createTheme } from '../../vendor/mui'
import { hostThemeToThemeOptions, sanitizeHostTheme } from './host-theme'

describe('hostThemeToThemeOptions', () => {
  it('returns mode-only palette options for an empty theme', () => {
    expect(hostThemeToThemeOptions(undefined, 'light')).toEqual({
      palette: { mode: 'light' },
    })
    expect(hostThemeToThemeOptions({}, 'dark')).toEqual({
      palette: { mode: 'dark' },
    })
  })

  it('forwards scheme colors and lets MUI derive missing shades', () => {
    const theme: HostTheme = {
      colorSchemes: {
        light: {
          primary: { main: '#336699' },
          background: { default: '#fafafa' },
          divider: '#e0e0e0',
        },
        dark: {
          primary: { main: '#88aacc' },
        },
      },
    }

    const light = hostThemeToThemeOptions(theme, 'light')
    expect(light.palette).toMatchObject({
      mode: 'light',
      primary: { main: '#336699' },
      background: { default: '#fafafa' },
      divider: '#e0e0e0',
    })

    const dark = hostThemeToThemeOptions(theme, 'dark')
    expect(dark.palette).toMatchObject({
      mode: 'dark',
      primary: { main: '#88aacc' },
    })

    // MUI derives the unset shades from `main`.
    const mui = createTheme(light)
    expect(mui.palette.primary.light).toBeTruthy()
    expect(mui.palette.primary.dark).toBeTruthy()
    expect(mui.palette.primary.contrastText).toBeTruthy()
  })

  it('maps typography font family and variant overrides', () => {
    const options = hostThemeToThemeOptions(
      {
        typography: {
          fontFamily: '"Inter", sans-serif',
          variants: {
            h1: { fontWeight: 800 },
            button: { textTransform: 'none' },
          },
        },
      },
      'light',
    )
    expect(options.typography).toEqual({
      fontFamily: '"Inter", sans-serif',
      h1: { fontWeight: 800 },
      button: { textTransform: 'none' },
    })
  })

  it('maps shape, spacing, and whitelisted component overrides', () => {
    const options = hostThemeToThemeOptions(
      {
        shape: { borderRadius: 12 },
        spacing: 4,
        components: {
          MuiButton: { defaultProps: { disableElevation: true } },
          MuiEvilComponent: { styleOverrides: { root: { display: 'none' } } },
        },
      },
      'light',
    )
    expect(options.shape).toEqual({ borderRadius: 12 })
    expect(options.spacing).toBe(4)
    expect(options.components).toEqual({
      MuiButton: { defaultProps: { disableElevation: true } },
    })
  })
})

describe('sanitizeHostTheme', () => {
  it('strips non-whitelisted components without mutating the input', () => {
    const theme: HostTheme = {
      components: {
        MuiLink: { styleOverrides: { root: { textDecoration: 'none' } } },
        MuiDataGrid: { defaultProps: { density: 'compact' } },
      },
    }
    const sanitized = sanitizeHostTheme(theme)
    expect(Object.keys(sanitized.components ?? {})).toEqual(['MuiLink'])
    expect(Object.keys(theme.components ?? {})).toEqual([
      'MuiLink',
      'MuiDataGrid',
    ])
  })

  it('drops the components branch entirely when nothing survives', () => {
    const sanitized = sanitizeHostTheme({
      components: { MuiDataGrid: { defaultProps: {} } },
    })
    expect(sanitized.components).toBeUndefined()
  })
})
