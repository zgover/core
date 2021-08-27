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

import { NavbarDrawer, SvgPathIcon } from '@aglyn/shared/ui/react'
import { _isStrT } from '@aglyn/shared/util/guards'
import { remap } from '@aglyn/shared/util/tools'
import { Box, Button } from '@material-ui/core'
import Container from '@material-ui/core/Container'
import IconButton from '@material-ui/core/IconButton'
import LinearProgress from '@material-ui/core/LinearProgress'
import { createStyles, fade, makeStyles, Theme } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import React from 'react'
import FieldSet from '../components/FieldSet'
import { Fields } from '../forms'


const useStyles = makeStyles<Theme, Props>((theme) => createStyles({
  closeButton: {marginRight: theme.spacing(2)},
  pt2: {paddingTop: theme.spacing(2)},
  wrapper: {position: 'relative'},
  loadingBar: {
    position: 'absolute',
    backgroundColor: fade(theme.palette.primary.main, 0.86),
    top: 0,
    left: 0,
    width: '100%',
  },
}))

export type Variant = 'creating' | 'updating'

type Props = {
  id: string,
  fields: Fields.FieldGroup
  label: string
  open: boolean
  variant: Variant,

  loading?: boolean
  error?: string | boolean
  onClose: React.MouseEventHandler
  onSave: React.MouseEventHandler<HTMLButtonElement>
  onUpdate: (fieldId: string) => React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>
}

export default function DrawerFormView(props: Props) {
  const classes = useStyles(props)
  const {
    id,
    fields,
    open,
    loading,
    error,
    variant = 'creating',
    label,
    onClose,
    onSave,
    onUpdate,
  } = props

  const isCreating = variant === 'creating'
  const actionLabel = isCreating ? 'Create' : 'Update'

  return (
    <NavbarDrawer
      appBarLeft={
        <React.Fragment>
          <IconButton
            children={<SvgPathIcon iconId="close"/>}
            className={classes.closeButton}
            color="default"
            edge="start"
            onClick={onClose}
          />
          <Typography
            children={`${actionLabel} ${label}`}
            color="inherit"
            component="div"
            variant="h6"
          />
        </React.Fragment>
      }
      appBarRight={
        <Button
          children={actionLabel}
          color="secondary"
          disabled={loading}
          variant="contained"
          onClick={onSave}
        />
      }
      open={open}
      onClose={onClose}
    >
      <div className={classes.wrapper}>
        {loading && (
          <React.Fragment>
            <LinearProgress classes={{root: classes.loadingBar}} color="secondary"/>
          </React.Fragment>
        )}


        <Container>
          <br/>
          {error && (_isStrT(error) ? error : 'Error loading...')}
          {!error && (
            <React.Fragment>
              <Typography
                children={'Unique ID'}
                variant="subtitle2"
              />
              <Typography
                children={id ?? '(none)'}
                variant="subtitle1"
              />
              <FieldSet fields={fields} loading={loading} onUpdate={onUpdate}/>
              <Box mt={2}>
                <Typography
                  children={'JSON Output'}
                  variant="subtitle2"
                />
                <Box
                  bgcolor="background.default"
                  mt={1}
                  overflow="scroll"
                  px={1}
                >
                  <pre>
                    {JSON.stringify(remap(fields, f => f.value ?? ''), null, 2)}
                  </pre>
                </Box>
              </Box>
            </React.Fragment>
          )}
        </Container>
      </div>

    </NavbarDrawer>
  )
}
