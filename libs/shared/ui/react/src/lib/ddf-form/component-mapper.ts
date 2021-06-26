import ComponentMapper from '@data-driven-forms/react-form-renderer/common-types/component-mapper'
// import muiComponentMapper from '@data-driven-forms/mui-component-mapper/component-mapper'

import { FieldComponent } from './types'
import FieldIconSelect from './components/FieldIconSelect'
import FieldSelect from './components/FieldSelect'
import FieldTextField from './components/FieldTextField'


export const componentMapper: ComponentMapper = {
  // ...muiComponentMapper,
  [FieldComponent.TEXT_FIELD]: FieldTextField,
  [FieldComponent.ICON_SELECT]: FieldIconSelect,
  [FieldComponent.SELECT]: FieldSelect,
}
