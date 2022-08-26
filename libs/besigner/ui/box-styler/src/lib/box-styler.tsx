/**
 * @license
 * Copyright 2022 Aglyn LLC
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

import { CssUnit, isGlobalUnit, Measurement } from '@aglyn/shared-data-enums'
import '@aglyn/shared-data-jsx'
import {
  alpha,
  darken,
  generateComponentClassKeys,
  styled,
} from '@aglyn/shared-ui-theme'
import {
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material'
import clsx from 'clsx'
import { forwardRef, useState } from 'react'

export const classKeys = generateComponentClassKeys('BoxStyler', [
  'box',
  'margin',
  'padding',
  'row',
  'node',
  'legendItem',
  'legendSwatch',
])

const Box = styled('div')(({ theme }) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 1,
    fontSize: '0.72rem',
    color: theme.palette.surface.contrastText,

    [`&.${classKeys.margin}, &.${classKeys.padding}`]: {
      flexShrink: 0.36,
    },
    [`&.${classKeys.node}`]: {
      flexShrink: 0.52,
    },
    [`> *`]: {
      width: '100%',
      textAlign: 'center',
    },

    [`&:not(.${classKeys.row})`]: {
      justifyContent: 'space-around',
    },
    [`&.${classKeys.row}`]: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    [`&.${classKeys.margin}`]: {
      height: 184,
      minWidth: 258,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: theme.palette.warning.dark,
      backgroundColor: alpha(theme.palette.surface.main, 0.96),
    },
    [`&.${classKeys.padding}`]: {
      height: 104,
      minWidth: 168,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: theme.palette.success.dark,
      backgroundColor: alpha(darken(theme.palette.surface.main, 0.12), 0.96),
    },
    [`&.${classKeys.node}`]: {
      minHeight: 24,
      minWidth: 78,
      maxWidth: 168,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: theme.palette.info.dark,
      backgroundColor: alpha(darken(theme.palette.surface.main, 0.24), 0.96),
      // background: [
      //   'linear-gradient(',
      //   '65deg, ',
      //   `${alpha(theme.palette.tertiary.main, 0.59)}, `,
      //   `${alpha(theme.palette.secondary.main, 0.59)}`,
      //   ') border-box',
      // ].join(''),
    },
  }
})

interface DimensionControlProps {
  dimension: Measurement
  onChange?: (dimension: Measurement) => void
}

const DimensionControl = (props: DimensionControlProps) => {
  const { dimension: initialDimension, onChange } = props
  const [dimension, setDimension] = useState<Measurement>({
    quantity: initialDimension?.quantity,
    unit: initialDimension?.unit ?? ('' as any),
  })
  const { quantity, unit } = dimension
  const [menuOpen, setMenuOpen] = useState(false)
  const [iconRef, setIconRef] = useState<any>()
  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const handleChange = (type: 'quantity' | 'unit') => (value: any) => {
    setDimension((prev) => {
      if (type === 'unit' && isGlobalUnit(value)) return { [type]: value }
      return { ...prev, [type]: value }
    })
    setMenuOpen(false)
    onChange && onChange(dimension)
  }

  return (
    <div>
      <FormControl sx={{ m: 0, width: '7ch' }} variant="standard">
        {!unit || isGlobalUnit(unit) ? (
          <IconButton
            ref={setIconRef}
            onClick={toggleMenu}
            onMouseDown={(e) => e.preventDefault()}
            sx={{
              fontSize: `0.65rem`,
              padding: 0,
            }}
          >
            {unit || 'default'}
          </IconButton>
        ) : (
          <Input
            value={quantity || ''}
            placeholder={'--'}
            onChange={(e) => handleChange('quantity')(e.target.value)}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{
                  margin: 0,
                }}
              >
                <IconButton
                  ref={setIconRef}
                  onClick={toggleMenu}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{
                    fontSize: `0.65rem`,
                    padding: 0,
                  }}
                >
                  {unit || 'default'}
                </IconButton>
              </InputAdornment>
            }
            sx={{
              padding: 0,
              fontSize: `0.65rem`,
              maxWidth: 50,
              paddingRight: 0,
              ':before': {
                border: 'none',
              },
              [`.MuiInput-input`]: {
                paddingRight: `2px !important`,
                textAlign: 'right',
              },
            }}
          />
        )}
        <Menu
          onClose={toggleMenu}
          open={menuOpen}
          anchorEl={iconRef}
          variant={'selectedMenu'}
        >
          <MenuItem
            onClick={(event) => handleChange('unit')('')}
            selected={!unit}
          >
            <em>{'default'}</em>
          </MenuItem>
          {Object.entries(CssUnit).map(([key, value]) => (
            <MenuItem
              onClick={(event) => handleChange('unit')(value)}
              key={key}
              selected={value === unit}
            >
              {key}
            </MenuItem>
          ))}
        </Menu>
      </FormControl>
    </div>
  )
}

const Legend = styled(Stack)(({ theme }) => {
  return {
    [`.${classKeys.legendSwatch}`]: {
      borderStyle: 'solid',
      borderWidth: 1,
      content: '" "',
      width: 10,
      height: 10,
      [`&.${classKeys.margin}`]: {
        borderStyle: 'dashed',
        borderColor: theme.palette.warning.dark,
      },
      [`&.${classKeys.padding}`]: {
        borderStyle: 'dashed',
        borderColor: theme.palette.success.dark,
      },
      [`&.${classKeys.node}`]: {
        borderColor: theme.palette.info.dark,
      },
    },
  }
})

type BoxStylerWrapperProps = JSX.ComponentProps<typeof Box>
type Measurements = {
  marginTop?: Measurement
  marginLeft?: Measurement
  marginRight?: Measurement
  marginBottom?: Measurement
  paddingTop?: Measurement
  paddingLeft?: Measurement
  paddingRight?: Measurement
  paddingBottom?: Measurement
}

export interface BoxStylerProps
  extends Omit<BoxStylerWrapperProps, 'onChange'> {
  measurements?: Measurements
  width?: Measurement
  height?: Measurement
  onChange?: (measurements?: Measurements) => void
}

const BoxStyler = forwardRef<any, BoxStylerProps>((props, ref) => {
  const {
    measurements: measurementsProp,
    width,
    height,
    onChange,
    ...rest
  } = props

  const [measurements, setMeasurements] = useState<Measurements>({
    ...measurementsProp,
  })

  const handleChange =
    (key: keyof Measurements) => (dimension: Measurement) => {
      setMeasurements((prev) => ({ ...prev, [key]: dimension }))
      onChange && onChange(measurements)
    }

  const {
    marginTop,
    marginLeft,
    marginRight,
    marginBottom,
    paddingTop,
    paddingLeft,
    paddingRight,
    paddingBottom,
  } = measurements

  const size = (dimension: any) => <span>{dimension?.quantity ?? '--'}</span>

  return (
    <Box ref={ref} {...rest}>
      <Box className={classKeys.margin}>
        <DimensionControl
          dimension={marginTop}
          onChange={handleChange('marginTop')}
        />
        <Box className={classKeys.row}>
          <DimensionControl
            dimension={marginLeft}
            onChange={handleChange('marginLeft')}
          />
          <Box className={classKeys.padding}>
            <DimensionControl
              dimension={paddingTop}
              onChange={handleChange('paddingTop')}
            />
            <Box className={classKeys.row}>
              <DimensionControl
                dimension={paddingLeft}
                onChange={handleChange('paddingLeft')}
              />
              <Box className={classKeys.node}>
                <Box className={classKeys.row}>
                  <span>Node</span>
                  {/*{size(width)}*/}
                  {/*{' x '}*/}
                  {/*{size(height)}*/}
                </Box>
              </Box>
              <DimensionControl
                dimension={paddingRight}
                onChange={handleChange('paddingRight')}
              />
            </Box>
            <DimensionControl
              dimension={paddingBottom}
              onChange={handleChange('paddingBottom')}
            />
          </Box>
          <DimensionControl
            dimension={marginRight}
            onChange={handleChange('marginRight')}
          />
        </Box>
        <DimensionControl
          dimension={marginBottom}
          onChange={handleChange('marginBottom')}
        />
      </Box>

      <Legend
        direction="row"
        alignItems="center"
        justifyContent="space-around"
        spacing={1}
        marginTop={0.5}
        marginBottom={1}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="start"
          className={classKeys.legendItem}
          spacing={1}
        >
          <div className={clsx(classKeys.legendSwatch, classKeys.margin)} />
          <div>{'Margin'}</div>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="start"
          className={classKeys.legendItem}
          spacing={1}
        >
          <div className={clsx(classKeys.legendSwatch, classKeys.padding)} />
          <div>{'Padding'}</div>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="start"
          className={classKeys.legendItem}
          spacing={1}
        >
          <div className={clsx(classKeys.legendSwatch, classKeys.node)} />
          <div>{'Node'}</div>
        </Stack>
      </Legend>
    </Box>
  )
})
BoxStyler.displayName = 'BoxStyler'
BoxStyler.defaultProps = {}
BoxStyler.aglyn = true
export { BoxStyler }
export default BoxStyler
