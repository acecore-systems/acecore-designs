import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildAiContext } from '../src/data/ai-context.mjs'
import { locales, inquiryUrl } from '../src/data/locales.mjs'
import { portfolioWorks, homeHeroWork } from '../src/data/portfolio.mjs'
import { onRequest } from '../functions/api/ai-chat.ts'
const json = (p) =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))

test('9 locales derive all 13 prices, 6 works and selected hero without a second content store', () => {
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
    assert.equal(context.works.length, 6)
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
    headers: { Origin: origin },
    ...(method === 'POST' ? { body: '{}' } : {}),
  })
test('bridge refuses cross-origin and missing binding, never falls back to a public endpoint', async () => {
  let calls = 0
  const env = {
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
