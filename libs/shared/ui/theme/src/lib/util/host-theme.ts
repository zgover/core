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

import type {
  HostTheme,
  HostThemeComponentOverride,
  HostThemePaletteColor,
  HostThemeScheme,
  HostThemeSchemeColors,
} from '@aglyn/shared-data-types'
import type { PaletteOptions, ThemeOptions } from '../../vendor/mui'

/**
 * Components a host theme may override. Persisted overrides are plain JSON;
 * anything outside this list is dropped by {@link sanitizeHostTheme} so a
 * tampered document can't restyle console-internal or portal-critical
 * components.
 */
export const HOST_THEME_COMPONENT_WHITELIST = [
  'MuiAppBar',
  'MuiAvatar',
  'MuiButton',
  'MuiButtonBase',
  'MuiCard',
  'MuiCardContent',
  'MuiChip',
  'MuiDivider',
  'MuiIconButton',
  'MuiLink',
  'MuiList',
  'MuiListItem',
  'MuiMenu',
  'MuiPaper',
  'MuiTextField',
  'MuiToolbar',
  'MuiTooltip',
  'MuiTypography',
] as const

export type HostThemeComponentKey =
  (typeof HOST_THEME_COMPONENT_WHITELIST)[number]

const componentWhitelist: ReadonlySet<string> = new Set(
  HOST_THEME_COMPONENT_WHITELIST,
)

function pickPaletteColor(color: HostThemePaletteColor | undefined) {
  if (!color?.main) return undefined
  const picked: HostThemePaletteColor = { main: color.main }
  if (color.light) picked.light = color.light
  if (color.dark) picked.dark = color.dark
  if (color.contrastText) picked.contrastText = color.contrastText
  return picked
}

function schemeColorsToPaletteOptions(
  scheme: HostThemeScheme,
  colors: HostThemeSchemeColors | undefined,
): PaletteOptions {
  const palette: PaletteOptions = { mode: scheme }
  if (!colors) return palette

  const colorKeys = [
    'primary',
    'secondary',
    'tertiary',
    'surface',
    'error',
    'warning',
    'info',
    'success',
  ] as const
  for (const key of colorKeys) {
    const color = pickPaletteColor(colors[key])
    if (color) (palette as Record<string, unknown>)[key] = color
  }

  if (colors.background?.default || colors.background?.paper) {
    palette.background = {
      ...(colors.background.default && { default: colors.background.default }),
      ...(colors.background.paper && { paper: colors.background.paper }),
    }
  }
  if (
    colors.text?.primary ||
    colors.text?.secondary ||
    colors.text?.disabled
  ) {
    palette.text = {
      ...(colors.text.primary && { primary: colors.text.primary }),
      ...(colors.text.secondary && { secondary: colors.text.secondary }),
      ...(colors.text.disabled && { disabled: colors.text.disabled }),
    }
  }
  if (colors.divider) palette.divider = colors.divider

  return palette
}

function sanitizeComponents(
  components: Record<string, HostThemeComponentOverride> | undefined,
) {
  if (!components) return undefined
  const sanitized: Record<string, HostThemeComponentOverride> = {}
  for (const [key, override] of Object.entries(components)) {
    if (!componentWhitelist.has(key) || !override) continue
    const entry: HostThemeComponentOverride = {}
    if (override.defaultProps) entry.defaultProps = override.defaultProps
    if (override.styleOverrides) entry.styleOverrides = override.styleOverrides
    if (Object.keys(entry).length) sanitized[key] = entry
  }
  return Object.keys(sanitized).length ? sanitized : undefined
}

/**
 * Strips unknown component overrides and empty branches from a persisted
 * host theme. Returns a new object; the input is never mutated.
 */
export function sanitizeHostTheme(theme: HostTheme | undefined): HostTheme {
  if (!theme) return {}
  const sanitized: HostTheme = { ...theme }
  const components = sanitizeComponents(theme.components)
  if (components) sanitized.components = components
  else delete sanitized.components
  return sanitized
}

/**
 * Converts a persisted {@link HostTheme} document into MUI `ThemeOptions`
 * for one color scheme. The result is meant to be passed through
 * `createResponsiveTheme` (or `createTheme`) by the consumer; shade and
 * contrast-text derivation for partial palettes is MUI's job, so only
 * explicitly set values are forwarded.
 */
export function hostThemeToThemeOptions(
  theme: HostTheme | undefined,
  scheme: HostThemeScheme,
): ThemeOptions {
  const sanitized = sanitizeHostTheme(theme)
  const options: ThemeOptions = {
    palette: schemeColorsToPaletteOptions(
      scheme,
      sanitized.colorSchemes?.[scheme],
    ),
  }

  const { typography } = sanitized
  if (typography?.fontFamily || typography?.variants) {
    options.typography = {
      ...(typography.fontFamily && { fontFamily: typography.fontFamily }),
      ...typography.variants,
    }
  }

  if (typeof sanitized.shape?.borderRadius === 'number') {
    options.shape = { borderRadius: sanitized.shape.borderRadius }
  }
  if (typeof sanitized.spacing === 'number') {
    options.spacing = sanitized.spacing
  }
  if (sanitized.components) {
    options.components = sanitized.components as ThemeOptions['components']
  }

  return options
}

export default hostThemeToThemeOptions
