type Env = {
  ACECORE_CHAT?: { fetch(request: Request): Promise<Response> }
}

// This bridge has no model credentials. Only the same-origin Designs page can
// reach the central worker through the existing private Service Binding.
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
  if (!env.ACECORE_CHAT) return failure(503, 'service_unavailable')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 28_000)
  try {
    const response = await env.ACECORE_CHAT.fetch(
      new Request(request, { signal: controller.signal }),
    )
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'no-store')
    headers.set('X-Content-Type-Options', 'nosniff')
    return new Response(response.body, { status: response.status, headers })
  } catch {
    return failure(controller.signal.aborted ? 504 : 503, 'service_unavailable')
  } finally {
    clearTimeout(timeout)
  }
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
