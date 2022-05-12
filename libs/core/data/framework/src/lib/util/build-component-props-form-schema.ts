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

import {copy} from '@aglyn/shared-util-tools'
import {DEFAULT_PROPS_FORM_SCHEMA} from '../constants/components'
import {type AglynComponentPropsFormSchema} from '../types/aglyn-components.types'


export const buildComponentPropsFormSchema = (
  formSchema?: AglynComponentPropsFormSchema,
): AglynComponentPropsFormSchema => {
  const defaults = copy(DEFAULT_PROPS_FORM_SCHEMA)
  const schema = copy(formSchema)
  return {
    ...defaults,
    ...schema,
    fields: [
      ...defaults.fields,
      ...schema?.fields || [],
    ],
  }
}

export default buildComponentPropsFormSchema
