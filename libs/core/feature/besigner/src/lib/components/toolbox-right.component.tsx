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

import { setBesignerPanels } from '@aglyn/core-data-framework'
import {
  useAglynAppContext,
  useAglynBesignerStore,
  useAglynCanvasApiEvents,
  useAglynComponentSchema,
  useAglynElementData,
} from '@aglyn/core-feature-renderer'
import { styled } from '@aglyn/shared-feature-themes'
import { componentMapper, FormRenderer, GridFormTemplate, SvgPathIcon } from '@aglyn/shared-ui-jsx'
import { _isEqualitySameType } from '@aglyn/shared-util-guards'
import MuiTabContext from '@mui/lab/TabContext'
import MuiTabList from '@mui/lab/TabList'
import MuiTabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import MuiTab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import { forwardRef, Fragment, memo, useCallback, useState } from 'react'
import { useAglynCanvasSelected } from '../hooks/use-aglyn-canvas-selected'
import { useComponentFormSchema } from '../hooks/use-component-form-schema'
import { ToolboxDrawerComponent, ToolboxDrawerComponentProps } from './toolbox-drawer.component'


const TabPanelInner = styled('div', {
  name: 'AglynTabPanelInner',
})(({theme}) => ({
  padding: theme.spacing(2),
  width: '100%',
}))
const DividerSpacer = styled(Divider, {
  name: 'AglynDividerSpacer',
})(({theme}) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}))
const TabPanel = memo(({panel: {component: Component, value}}: any) => {
  const {$id} = useAglynCanvasSelected() || {}

  return (
    <MuiTabPanel value={value} sx={{p: 0, overflow: 'auto'}}>
      {$id ? (<Component $id={$id} />) : (
        <TabPanelInner>
          <Typography variant="subtitle1" component="div" align="center">
            No element selected...
          </Typography>
        </TabPanelInner>
      )}
    </MuiTabPanel>
  )
})

const ElementInfo = memo(({$id, ...props}: any) => {
  const {componentId, bundleId, parentId} = useAglynElementData($id) || {}
  const {metadata} = useAglynComponentSchema(componentId, bundleId) || {}
  const {displayName, title, subtitle, description} = metadata || {}
  const failoverText = '(undefined)'
  const details = [
    {
      id: 'element-overview',
      label: 'Element Overview',
      items: [
        {
          id: 'component-display-name',
          label: 'Type',
          value: displayName,
        },
        {
          id: 'component-title',
          label: 'Title',
          value: title,
        },
        {
          id: 'component-subtitle',
          label: 'Subtitle',
          value: subtitle,
        },
        {
          id: 'component-description',
          label: 'Description',
          value: description,
        },
      ],
    },
    {
      id: 'unique-identifiers',
      label: 'Unique Identifiers',
      items: [
        {
          id: 'element-id',
          label: 'Element ID',
          value: $id,
        },
        {
          id: 'parent-id',
          label: 'Parent Element ID',
          value: parentId,
        },
        {
          id: 'component-id',
          label: 'Component ID',
          value: componentId,
        },
        {
          id: 'bundle-id',
          label: 'Bundle ID',
          value: bundleId,
        },
      ],
    },
  ]
  return (
    <TabPanelInner {...props}>
      {details.map(({id, label, items}) => (
        <Fragment key={id}>
          <Typography variant="subtitle1" component="div" sx={{mb: 2}}>
            {label}
          </Typography>
          {items.map(({id, label, value}) => (
            <Fragment key={id}>
              <Typography variant="caption" component="div" sx={{textTransform: 'uppercase'}}>
                <b>{label}:</b>
              </Typography>
              <Typography variant="body1" component="div" gutterBottom>
                {value || <i>{failoverText}</i>}
              </Typography>
            </Fragment>
          ))}
          <DividerSpacer variant="middle" />
        </Fragment>
      ))}
    </TabPanelInner>
  )
})
const PropsForm = memo(({$id, ...props}: any) => {
  const {updateElement, deleteElement} = useAglynCanvasApiEvents()
  const {props: elemProps, componentId, bundleId} = useAglynElementData($id) || {}
  const formSchema = useComponentFormSchema({componentId, bundleId})

  const handleFormCancel = useCallback((e, reason) => {}, [])
  const handleElementSave = useCallback((values) => {
    updateElement({element: {$id, props: {...values}}})
  }, [$id])
  const handleDeleteElement = useCallback((e) => {
    deleteElement({$id})
  }, [$id])

  return (
    <TabPanelInner {...props}>
      <FormRenderer
        FormTemplate={GridFormTemplate}
        componentMapper={componentMapper}
        onCancel={handleFormCancel}
        onSubmit={handleElementSave}
        initialValues={elemProps}
        schema={formSchema}
      />

      <FormControl margin="none" fullWidth>
        <Button onClick={handleDeleteElement} sx={{mt: 2, color: 'error.main'}} fullWidth>
          Delete Element
        </Button>
      </FormControl>
    </TabPanelInner>
  )
})

const panels = [
  {
    value: 'element-information',
    iconIds: 'information-variant',
    component: ElementInfo,
  },
  {
    value: 'element-props-form',
    iconIds: 'order-bool-descending-variant',
    component: PropsForm,
  },
]

export interface ToolboxRightComponentProps extends ToolboxDrawerComponentProps {}

export const ToolboxRightComponent = forwardRef<any, ToolboxRightComponentProps>(
  function RefRenderFn(props, ref) {
    const {children, drawerWidth: drawerWidthProp, ...rest} = props

    const {getApp} = useAglynAppContext()
    const panel = useAglynBesignerStore('panels', 'right')
    const {toggled, tab, drawerWidth = drawerWidthProp} = panel || {}
    const value = tab && _isEqualitySameType(tab, ...panels.map((i) => i.value))
      ? tab : 'element-information'
    const handleTabChange = useCallback((e, val) => {
      setBesignerPanels(getApp(), {right: {tab: val}})
    }, [])

    return (
      <ToolboxDrawerComponent
        ref={ref}
        drawerWidth={drawerWidth}
        open={toggled}
        anchor="right"
        {...rest}
      >
        <MuiTabContext value={value}>
          <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
            <MuiTabList
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="secondary"
              textColor="primary"
            >
              {panels.map(({value, iconIds}) => (
                <MuiTab key={value} value={value} icon={<SvgPathIcon iconIds={iconIds} />} />
              ))}
            </MuiTabList>
          </Box>
          {panels.map((panel) => <TabPanel key={panel.value} panel={panel} />)}
        </MuiTabContext>

        {children}
      </ToolboxDrawerComponent>
    )
  },
)

ToolboxRightComponent.displayName = 'ToolboxRightComponent'
ToolboxRightComponent.defaultProps = {}

export default ToolboxRightComponent
