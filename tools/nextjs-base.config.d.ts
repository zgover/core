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

import type {WithNxOptions} from '@nrwl/next/plugins/with-nx'


export interface WithAglynOptions extends WithNxOptions {
  aglyn?: {
    // Build webpack with webpack-bundle-analyzer plugin
    analyzeBundle?: true,
    analyzerOptions?: {
      analyzerMode?: 'json' | 'static' | 'server'
      serverFilename?: string
      clientFilename?: string
      reportTitle?: string,
      defaultSizes?: 'parsed' | string,
      generateStatsFile?; true,
      statsFilename?: string,
      statsOptions?: any,
      excludeAssets?: any,
      logLevel: 'info' | string,
    }
  },
  publicRuntimeConfig?: WithNxOptions['publicRuntimeConfig'] & {
    staticFolder?: string
  }
}

export type WithAglyn = {
  (nextConfig?: WithAglynOptions): WithAglynOptions
}

export default WithAglyn
