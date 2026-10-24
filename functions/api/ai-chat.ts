type Env = {
  ACECORE_CHAT?: { fetch(request: Request): Promise<Response> }
  ASSETS?: { fetch(request: Request): Promise<Response> }
}
const LOCALES = ['ja', 'en', 'zh-cn', 'es', 'pt', 'fr', 'ko', 'de', 'ru']

// Browser data never supplies the grounding. ASSETS reads the fixed file from
// this exact Pages deployment; only the private Service Binding gets it.
export async function onRequest({
  request,
  env,
}: {
  request: Request
  env: Env
}) {
  const url = new URL(request.url)
  if (request.method !== 'POST') return failure(405, 'method_not_allowed')
  const allowedHost =
    url.hostname === 'designs.acecore.net' ||
    url.hostname === 'acecore-designs.pages.dev' ||
    url.hostname.endsWith('.acecore-designs.pages.dev') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1'
  if (!allowedHost || request.headers.get('Origin') !== url.origin)
    return failure(403, 'forbidden_origin')
  if (
    !request.headers
      .get('Content-Type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    return failure(415, 'invalid_content_type')
  const body = await readBounded(request, 12_288)
  if (body === null) return failure(413, 'request_too_large')
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return failure(400, 'invalid_request')
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    typeof payload.locale !== 'string' ||
    !LOCALES.includes(payload.locale) ||
    typeof payload.question !== 'string' ||
    !payload.question.trim() ||
    payload.question.length > 800
  )
    return failure(400, 'invalid_request')
  const messages = payload.messages ?? []
  if (
    !Array.isArray(messages) ||
    messages.length > 8 ||
    messages.some(
      (m) =>
        !m ||
        typeof m !== 'object' ||
        !['user', 'assistant'].includes(m.role) ||
        typeof m.content !== 'string' ||
        m.content.length > 800,
    ) ||
    messages.reduce((n, m) => n + m.content.length, 0) > 2400
  )
    return failure(400, 'invalid_history')
  if (!env.ACECORE_CHAT || !env.ASSETS)
    return failure(503, 'service_unavailable')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 28_000)
  try {
    const assetUrl = new URL(`/ai-context/${payload.locale}.json`, url.origin)
    const asset = await env.ASSETS.fetch(
      new Request(assetUrl, { signal: controller.signal, redirect: 'manual' }),
    )
    if (
      !asset.ok ||
      asset.redirected ||
      !/^application\/json\b/i.test(asset.headers.get('Content-Type') || '')
    )
      return failure(503, 'context_unavailable')
    const text = await readBounded(asset, 256 * 1024)
    if (text === null) return failure(503, 'context_unavailable')
    const context = JSON.parse(text)
    if (
      context.schemaVersion !== 1 ||
      context.locale !== payload.locale ||
      context.sourceUrl !== 'https://designs.acecore.net/'
    )
      return failure(503, 'context_unavailable')
    // Fresh headers/body discard browser context, scope, URLs and internal
    // headers. The worker revalidates the full server-owned context schema.
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: url.origin,
    })
    for (const name of ['CF-Connecting-IP', 'X-Acecore-AI-Client']) {
      const value = request.headers.get(name)
      if (value) headers.set(name, value)
    }
    const response = await env.ACECORE_CHAT.fetch(
      new Request(request.url, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          question: payload.question,
          locale: payload.locale,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          designsContext: context,
        }),
      }),
    )
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Cache-Control', 'no-store')
    responseHeaders.set('X-Content-Type-Options', 'nosniff')
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch {
    return failure(controller.signal.aborted ? 504 : 503, 'service_unavailable')
  } finally {
    clearTimeout(timeout)
  }
}

async function readBounded(
  source: Request | Response,
  limit: number,
): Promise<string | null> {
  const length = Number(source.headers.get('Content-Length') || 0)
  if (
    !Number.isSafeInteger(length) ||
    length < 0 ||
    length > limit ||
    !source.body
  )
    return null
  const reader = source.body.getReader(),
    chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > limit) return null
      chunks.push(value)
    }
  } catch {
    return null
  } finally {
    await reader.cancel().catch(() => {})
  }
  const buffer = new Uint8Array(bytes)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(buffer)
}
function failure(status: number, error: string) {
  return Response.json(
    { ok: false, error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...(status === 405 ? { Allow: 'POST' } : {}),
      },
    },
  )
}
