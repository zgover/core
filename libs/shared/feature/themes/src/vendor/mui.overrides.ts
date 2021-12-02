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

import type { Theme, ClassNameMap } from '@mui/material/styles'
import type { Shadows } from '@mui/material/styles/shadows'
import type { WithStyles } from '@mui/styles'
import type { ClassKeyInferable } from '@mui/styles/withStyles'
import type { Shape } from '@mui/system/createTheme/shape'
import type { TypeActionSvgState } from '../lib/theme.types'


interface ColorPropOverrides {
  quaternary: true
  tertiary: true
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides extends ColorPropOverrides {}
}
declare module '@mui/material/ButtonGroup' {
  interface ButtonGroupPropsColorOverrides extends ColorPropOverrides {}
}
declare module '@mui/material/ToggleButtonGroup' {
  interface ToggleButtonGroupPropsColorOverrides extends ColorPropOverrides {}
}
declare module '@mui/material/Fab' {
  interface FabPropsColorOverrides extends ColorPropOverrides {}
}
declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsColorOverrides extends ColorPropOverrides {}
}
declare module '@mui/material/AppBar' {
  interface AppBarPropsColorOverrides extends ColorPropOverrides {}
}

declare module '@mui/material/styles' {
  /**
   * START EXAMPLE – MODULE AUGMENTATION ↓
   * ⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄
   * ```typescript
   * // Add new property ↓
   * declare module '@mui/material/styles' {
   *   interface Theme {
   *     status: {
   *       danger: React.CSSProperties['color'],
   *     }
   *   }
   *   interface ThemeOptions {
   *     status: {
   *       danger: React.CSSProperties['color']
   *     }
   *   }
   * }
   * const theme = createMuiTheme({
   *   status: {
   *     danger: '#e53e3e',
   *   },
   * })
   *
   * // Add to existing property (e.g., palette, typography) ↓
   * declare module "@mui/material/styles" {
   *   interface Palette {
   *     neutral: Palette['primary']
   *   }
   *   interface PaletteOptions {
   *     neutral: PaletteOptions['primary']
   *   }
   * }
   * const theme = createMuiTheme({
   *   palette: {
   *     neutral: {
   *       main: '#5c6ac4',
   *     },
   *   },
   * })
   * ```
   * ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   * END EXAMPLE – MODULE AUGMENTATION ↑
   */

  interface Palette {
    tertiary: Palette['primary']
    quaternary: Palette['primary']
    svgBg?: TypeActionSvgState
    svgFilled?: TypeActionSvgState
    svgStroke?: TypeActionSvgState
    background: Palette['background']
    text: Palette['text']
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions['primary']
    quaternary?: PaletteOptions['primary']
    svgBg?: TypeActionSvgState
    svgFilled?: TypeActionSvgState
    svgStroke?: TypeActionSvgState
    background?: PaletteOptions['background']
  }

  interface Theme {
    insetShadows: Shadows
    shape: Shape & { appIconBorderRadius: number | string }
  }

  type ExtendPropsOfWithStyles<P extends { classes?: ClassNameMap<string> },
    StylesType extends ClassKeyInferable<any, any>,
    IncludeTheme extends boolean | undefined = false> = P & WithStyles<StylesType, IncludeTheme>
}

declare module '@mui/styles' {
  interface DefaultTheme extends Theme {}
}


export {}
