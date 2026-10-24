import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildAiContext } from '../src/data/ai-context.mjs'
import { locales, inquiryUrl } from '../src/data/locales.mjs'
import { portfolioWorks, homeHeroWork } from '../src/data/portfolio.mjs'
import { onRequest } from '../functions/api/ai-chat.ts'
const json = (p) =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))

test('9 locales derive all 13 prices, 5 works and selected hero without a second content store', () => {
  for (const locale of locales) {
    const catalog = json(`../src/content/catalog/${locale}.json`)
    const copy = json(`../src/content/ui/${locale}.json`)
    const context = buildAiContext(locale, catalog, copy)
    assert.equal(context.locale, locale)
    assert.deepEqual(
      context.services.map(({ id, price, title, description }) => ({
        id,
        price,
        title,
        description,
      })),
      catalog.groups.flatMap((g) => g.services),
    )
    assert.equal(context.services.length, 13)
    assert.equal(context.works.length, 5)
    assert.equal(context.conditions, catalog.conditionsBody)
    assert.equal(context.featuredWork.url, homeHeroWork.sourceUrl)
    for (const service of context.services)
      assert.equal(service.contactUrl, inquiryUrl(locale, service.id))
    for (const work of portfolioWorks)
      assert.deepEqual(
        context.works.find((w) => w.id === work.id).services,
        work.services,
      )
    assert.ok(copy.aiChat.disclosure)
    assert.equal(copy.aiChat.quickPrompts.length, 3)
  }
})

const request = (origin = 'https://designs.acecore.net', method = 'POST') =>
  new Request('https://designs.acecore.net/api/ai-chat', {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    ...(method === 'POST'
      ? { body: JSON.stringify({ question: '公開サービスは？', locale: 'ja' }) }
      : {}),
  })
test('bridge refuses cross-origin and missing binding, never falls back to a public endpoint', async () => {
  let calls = 0
  const env = {
    ASSETS: {
      fetch: async () =>
        Response.json(
          buildAiContext(
            'ja',
            json('../src/content/catalog/ja.json'),
            json('../src/content/ui/ja.json'),
          ),
        ),
    },
    ACECORE_CHAT: {
      fetch: async () => {
        calls++
        return Response.json({ ok: true, answer: 'fixture' })
      },
    },
  }
  assert.equal(
    (await onRequest({ request: request('https://evil.example'), env })).status,
    403,
  )
  assert.equal(
    (await onRequest({ request: request(undefined, 'GET'), env })).status,
    405,
  )
  assert.equal((await onRequest({ request: request(), env: {} })).status, 503)
  assert.equal(calls, 0)
  const response = await onRequest({ request: request(), env })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(calls, 1)
})

test('browser context, scope, internal headers and URL cannot replace deployment ASSETS', async () => {
  let forwarded, assetPath
  const canonical = buildAiContext(
    'ja',
    json('../src/content/catalog/ja.json'),
    json('../src/content/ui/ja.json'),
  )
  const env = {
    ASSETS: {
      fetch: async (r) => {
        assetPath = new URL(r.url).pathname
        return Response.json(canonical)
      },
    },
    ACECORE_CHAT: {
      fetch: async (r) => {
        forwarded = r
        return Response.json({ ok: true, answer: 'fixture' })
      },
    },
  }
  const req = new Request('https://designs.acecore.net/api/ai-chat', {
    method: 'POST',
    headers: {
      Origin: 'https://designs.acecore.net',
      'Content-Type': 'application/json',
      'X-Internal-Context': 'fake',
    },
    body: JSON.stringify({
      question: '料金は？',
      locale: 'ja',
      contextUrl: 'https://evil.example',
      scope: 'systems',
      designsContext: { services: [{ price: 1 }] },
    }),
  })
  assert.equal((await onRequest({ request: req, env })).status, 200)
  assert.equal(assetPath, '/ai-context/ja.json')
  assert.equal(forwarded.headers.get('X-Internal-Context'), null)
  const body = await forwarded.json()
  assert.deepEqual(body.designsContext, canonical)
  assert.equal(body.scope, undefined)
  assert.equal(body.contextUrl, undefined)
})
test('invalid locale/path, oversized browser input and invalid ASSETS fail before worker', async () => {
  let calls = 0
  const env = {
    ASSETS: {
      fetch: async () => {
        calls++
        return Response.json({})
      },
    },
    ACECORE_CHAT: {
      fetch: async () => {
        throw Error('must not forward')
      },
    },
  }
  for (const locale of ['../../private', 'xx', 'ja.json?path=x']) {
    const req = new Request('https://designs.acecore.net/api/ai-chat', {
      method: 'POST',
      headers: {
        Origin: 'https://designs.acecore.net',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: '公開情報', locale }),
    })
    assert.equal((await onRequest({ request: req, env })).status, 400)
  }
  assert.equal(calls, 0)
  const large = new Request('https://designs.acecore.net/api/ai-chat', {
    method: 'POST',
    headers: {
      Origin: 'https://designs.acecore.net',
      'Content-Type': 'application/json',
    },
    body: 'x'.repeat(12289),
  })
  assert.equal((await onRequest({ request: large, env })).status, 413)
  assert.equal(calls, 0)
  assert.equal((await onRequest({ request: request(), env })).status, 503)
  const unknown = new Request('https://evil.example/api/ai-chat', {
    method: 'POST',
    headers: {
      Origin: 'https://evil.example',
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  assert.equal((await onRequest({ request: unknown, env })).status, 403)
})
