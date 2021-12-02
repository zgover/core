/**
 * @license
 * Copyright 2021 Aglyn LLC
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

import type { Theme } from '@mui/material/styles'
import type {
  FilteringStyledOptions,
  MuiStyledOptions,
  StyledComponent,
  SxProps,
} from '@mui/system'
import type { ElementType } from 'react'
import './mui.overrides'


export type StyledOptions<P = any, FP extends keyof P = keyof P> = FilteringStyledOptions<P, FP> & MuiStyledOptions
export type StyledElement = StyledComponent<Pick<any, string | number | symbol> & { theme?: Theme; as?: ElementType<any>; sx?: SxProps<Theme>; }, any, Theme>


export type {
  Overwrite,
} from '@mui/types'

export type {
  ShapeOptions,
  Spacing,
  SpacingOptions,
  FilteringStyledOptions,
  MuiStyledOptions,
  StyledComponent,
  SxProps,
} from '@mui/system'

export { visuallyHidden } from '@mui/utils'

export type {
  Breakpoint,
  BreakpointOverrides,
  Breakpoints,
  BreakpointsOptions,
  ClassNameMap,
  ColorFormat,
  ColorObject,
  ComponentsOverrides,
  ComponentsProps,
  ComponentsPropsList,
  ComponentsVariants,
  CreateMUIStyled,
  CSSObject,
  Direction,
  Duration,
  Easing,
  ExtendPropsOfWithStyles,
  Palette,
  PaletteColor,
  PaletteColorOptions,
  PaletteOptions,
  SimplePaletteColorOptions,
  StyledComponentProps,
  Theme,
  ThemedProps,
  ThemeOptions,
  ThemeWithProps,
  Transitions,
  TransitionsOptions,
  TypographyStyle,
  TypographyVariant,
  TypographyVariants,
  TypographyVariantsOptions,
} from '@mui/material/styles'

export {
  alpha,
  createTheme,
  darken,
  decomposeColor,
  easing,
  emphasize,
  experimentalStyled,
  getContrastRatio,
  getLuminance,
  hexToRgb,
  hslToRgb,
  lighten,
  recomposeColor,
  responsiveFontSizes,
  rgbToHex,
  styled,
  StyledEngineProvider,
  ThemeProvider,
  useTheme,
  useThemeProps,
} from '@mui/material/styles'

export type {
  BaseCreateCSSProperties,
  BaseCSSProperties,
  CSSProperties,
  ServerStyleSheets,
  StyledProps,
  StyleRules,
  StyleRulesCallback,
  Styles,
  StylesOptions,
  StylesProviderProps,
  ThemedComponentProps,
  ThemeOfStyles,
  ThemeProviderProps,
  WithStyles,
  WithStylesOptions,
  WithTheme,
  WithThemeCreatorOption,
} from '@mui/styles'

export {
  createStyles,
  getThemeProps,
  jssPreset,
  makeStyles,
  StylesContext,
  StylesProvider,
  useThemeVariants,
  withStyles,
  withThemeCreator,
} from '@mui/styles'
