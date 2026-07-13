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
'use client'

import type { ReactNode } from 'react'
import AuthenticatedLayout from '../../components/layouts/authenticated.layout'

/**
 * Full-screen host editor shell (App Router route group, AGL-401): the
 * besigner, screen preview/view, and theme editor used `[AuthenticatedLayout]`
 * only (no MainLayout app bar) so the canvas fills the viewport.
 */
export default function EditorLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
