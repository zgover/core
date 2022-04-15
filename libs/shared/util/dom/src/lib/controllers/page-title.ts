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

import {_isStrEmpty, _isUndOrNull} from '@aglyn/shared-util-guards'
import {arraySafe} from '@aglyn/shared-util-tools'
import {Subject} from 'rxjs'


export type PageTitleObject = {
  number?
  screen?
  suffix?
  separator?
}

let _values: PageTitleObject = {suffix: 'My App'}
export const $pageTitle = new Subject()
export const $_screenObj = new Subject<PageTitleObject>()

function buildScreenTitle(values: PageTitleObject): void {
  const {
    number,
    screen,
    suffix,
    separator,
  } = buildValues(values)

  const newTitle = arraySafe(screen, [screen])
    .concat(!number ? null : ` - Page ${number}`, suffix)
    .filter(i => !_isUndOrNull(i) && !_isStrEmpty(i))
    .join(separator)

  $pageTitle.next(newTitle)
}

function buildValues(values?: PageTitleObject): PageTitleObject {
  return _values = {
    number: values.number ?? _values.number,
    screen: values.screen || _values.screen,
    suffix: values.suffix || _values.suffix,
    separator: values.separator || _values.separator,
  }
}

export function setScreenName(screen, number?): void {
  $_screenObj.next(buildValues({screen, number}))
}
export function setScreenSeparator(separator): void {
  $_screenObj.next(buildValues({separator}))
}
export function setScreenSuffix(suffix): void {
  $_screenObj.next(buildValues({suffix}))
}
export function setScreenNumber(number?): void {
  $_screenObj.next(buildValues({number}))
}
export function setScreenTitle(values: PageTitleObject): void {
  $_screenObj.next(buildValues(values))
}

$_screenObj.subscribe({
  next: (values) => {
    buildScreenTitle(values)
  },
})
