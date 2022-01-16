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

import {type NextRequest, NextResponse} from 'next/server'
import {IMPLICIT_DIRS} from '../constants/site-paths'


export default function middleware(req: NextRequest) {
  const {pathname} = req.nextUrl
  // Get hostname (e.g. vercel.com, test.vercel.app, etc.)
  const hostHeader = req.headers.get('host')

  // If localhost, assign the host value manually
  // If prod, get the custom domain/subdomain value by removing the root URL
  // (in the case of "test.vercel.app", "vercel.app" is the root URL)
  const subdomain =
    process.env.NODE_ENV === 'production'
      ? hostHeader.replace(`.${process.env.AGLYN_TENANT_DOMAIN}`, '')
      : process.env.NODE_ENV === 'development'
        ? hostHeader.replace(`.${process.env.HOST}`, '')
        : process.env.AGLYN_TENANT_CNAME || process.env.AGLYN_TENANT_SUBDOMAIN

  // Prevent security issues – users should not be able to canonically access
  // the pages/_sites folder and its respective contents. This can also be
  // done via rewrites to a custom 404 page
  if (pathname.startsWith(`/_tenants`)) {
    return new Response(null, {status: 404})
  }

  if (!IMPLICIT_DIRS.some((path) => pathname.startsWith(path))) {
    // rewrite to the current hostname under the pages/_sites folder
    // the main logic component will happen in pages/_sites/[host]/[...path].tsx
    return NextResponse.rewrite(`/_sites/${subdomain}${pathname}`)
  }
}
