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

import { CANVAS_ROOT_ELEMENT_ID, createResourceUid } from '@aglyn/aglyn'
import { doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

/**
 * Creates a besigner email document (AGL-347/349): a screen with kind
 * 'email' plus a first version seeded with an email section + a greeting
 * text block. Shared by the campaigns composer and the email-screens list
 * so both scaffold identical documents. Returns the ids for navigation.
 */
export async function createEmailScreen(
  firestore: Firestore,
  hostId: string,
  displayName = 'Untitled email',
): Promise<{ screenId: string; versionId: string }> {
  const screenId = createResourceUid()
  const versionId = createResourceUid()
  const timestamp = Timestamp.now()
  const sectionId = createResourceUid()
  const textId = createResourceUid()
  await Promise.all([
    setDoc(doc(firestore, 'hosts', hostId, 'screens', screenId), {
      displayName,
      kind: 'email',
      versionId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
    setDoc(
      doc(firestore, 'hosts', hostId, 'screens', screenId, 'versions', versionId),
      {
        screenId,
        createdAt: timestamp,
        updatedAt: timestamp,
        nodes: {
          [CANVAS_ROOT_ELEMENT_ID]: {
            $id: CANVAS_ROOT_ELEMENT_ID,
            componentId: 'div',
            nodes: [sectionId],
          },
          [sectionId]: {
            $id: sectionId,
            componentId: 'emailSection',
            pluginId: 'email',
            parentId: CANVAS_ROOT_ELEMENT_ID,
            nodes: [textId],
          },
          [textId]: {
            $id: textId,
            componentId: 'emailText',
            pluginId: 'email',
            parentId: sectionId,
            props: {
              children: 'Hello {{contact.firstName}},',
              variant: 'body',
            },
          },
        },
      },
    ),
  ])
  return { screenId, versionId }
}
