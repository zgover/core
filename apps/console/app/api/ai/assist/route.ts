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

import { pluginRequestFromWeb } from '@aglyn/aglyn/server'
import {
  COMMUNITY_COMPONENT_ID_ALLOWLIST,
  sanitizeCommunityDefinition,
} from '@aglyn/aglyn/server'
import { firebaseAdmin } from '@aglyn/tenant-data-admin'

const MODEL = 'claude-sonnet-5'

/**
 * AI assist (AGL-89): rewrites/generates copy for a besigner element via
 * the Anthropic Messages API. Env-gated on ANTHROPIC_API_KEY (501 without,
 * same degrade pattern as Stripe); auth via Firebase ID token.
 */
async function handler(request: Request): Promise<Response> {
  const { method, body, headers: rawHeaders } = await pluginRequestFromWeb(request)
  const headers = rawHeaders as Partial<Record<string, string>>
  if (method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'AI assist is not configured (ANTHROPIC_API_KEY).' }, { status: 501 })
  }

  const authorization = headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const text = String(body?.text ?? '').slice(0, 12000)
  const instruction = String(body?.instruction ?? '').slice(0, 500)
  // Modes (AGL-130): 'element' rewrites short copy; 'blog' writes or
  // improves markdown-lite entry bodies with title/excerpt context.
  const mode =
    body?.mode === 'blog'
      ? 'blog'
      : body?.mode === 'section'
        ? 'section'
        : 'element'
  const title = String(body?.title ?? '').slice(0, 200)
  const excerpt = String(body?.excerpt ?? '').slice(0, 500)
  if (!instruction) {
    return Response.json({ error: 'Missing instruction' }, { status: 400 })
  }

  try {
    await firebaseAdmin.app().auth().verifyIdToken(idToken)

    // Generate section (AGL-169): a constrained-JSON node subtree over the
    // community component allowlist; the response passes the same
    // sanitizer as community installs before it ever reaches a canvas.
    if (mode === 'section') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 3000,
          system:
            'You design one website section inside a site builder. Reply ' +
            'with ONLY a JSON object, no prose or code fences: ' +
            '{"rootId":"n1","nodes":{"n1":{"$id":"n1","componentId":"muiStack","parentId":null,"props":{},"nodes":["n2"]},...}}. ' +
            'Every node needs $id, componentId, parentId (null for the ' +
            'root), and children listed in "nodes" (child ids). Allowed ' +
            `componentIds: ${COMMUNITY_COMPONENT_ID_ALLOWLIST.join(', ')}. ` +
            'Useful props — muiStack: {direction:"row"|"column", spacing, ' +
            'justifyContent, alignItems}; muiTypography: {children, ' +
            'variant:"h1".."h6"|"body1"|"subtitle1"}; muiButton: ' +
            '{children, variant:"contained"|"outlined", color}; image: ' +
            '{src, alt}; muiContainer: {maxWidth:"sm"|"md"|"lg"}. Keep it ' +
            'small: 4-12 nodes, one root container. Leave image src empty. ' +
            'Write real copy, not lorem ipsum.',
          messages: [
            { role: 'user', content: `Section to design: ${instruction}` },
          ],
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        console.error(payload)
        return Response.json({ error: payload?.error?.message ?? 'AI request failed' }, { status: 502 })
      }
      const raw = (payload?.content ?? [])
        .filter((block: any) => block?.type === 'text')
        .map((block: any) => block.text)
        .join('')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
      let parsed: any
      try {
        parsed = JSON.parse(raw)
      } catch {
        return Response.json({ error: 'AI returned invalid JSON' }, { status: 502 })
      }
      const sanitized = sanitizeCommunityDefinition({
        rootId: String(parsed?.rootId ?? ''),
        nodes: parsed?.nodes ?? {},
      })
      if (sanitized.ok === false) {
        return Response.json({ error: sanitized.error }, { status: 422 })
      }
      return Response.json({ section: { rootId: sanitized.rootId, nodes: sanitized.nodes } }, { status: 200 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: mode === 'blog' ? 2048 : 1024,
        system:
          mode === 'blog'
            ? 'You write blog posts inside a site builder. Reply with ONLY ' +
              'the post body in markdown-lite: **bold**, *italic*, ## ' +
              'headings, - lists, [links](https://url). No front matter, ' +
              'title line, or preamble — the title renders separately.'
            : 'You write website copy inside a site builder. Reply with ' +
              'ONLY the final text for the element — no quotes, preamble, ' +
              'or markdown. Keep roughly the same length and role as the ' +
              'current text unless the instruction says otherwise.',
        messages: [
          {
            role: 'user',
            content:
              mode === 'blog'
                ? [
                    title && `Title: ${title}`,
                    excerpt && `Excerpt: ${excerpt}`,
                    text && `Current body:\n${text}`,
                    `Instruction: ${instruction}`,
                  ]
                    .filter(Boolean)
                    .join('\n\n')
                : text
                  ? `Current element text:\n${text}\n\nInstruction: ${instruction}`
                  : `Write website element text. Instruction: ${instruction}`,
          },
        ],
      }),
    })
    const payload = await response.json()
    if (!response.ok) {
      console.error(payload)
      return Response.json({ error: payload?.error?.message ?? 'AI request failed' }, { status: 502 })
    }
    const output = (payload?.content ?? [])
      .filter((block: any) => block?.type === 'text')
      .map((block: any) => block.text)
      .join('')
      .trim()
    if (!output) return Response.json({ error: 'Empty AI response' }, { status: 502 })
    return Response.json({ text: output }, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Assist failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export { handler as POST }
