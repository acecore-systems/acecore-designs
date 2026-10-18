import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { approvedLocales, approvedPrices } from '../tests/approved-services.mjs'
import { htmlLangMap, ogLocaleMap } from '../src/data/locales.mjs'

const origin = 'https://designs.acecore.net'
const dist = new URL('../dist/', import.meta.url)
const read = (path) => readFileSync(new URL(path, dist), 'utf8')
const source = (locale) =>
  JSON.parse(
    readFileSync(
      new URL(`../src/content/catalog/${locale}.json`, import.meta.url),
      'utf8',
    ),
  )
const decode = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
const attributes = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [
      match[1],
      decode(match[2]),
    ]),
  )
const tags = (html, tag) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map((match) =>
    attributes(match[0]),
  )
const pagePath = (locale) => (locale === 'ja' ? '/' : `/${locale}/`)
const pageFile = (pathname) =>
  pathname === '/'
    ? 'index.html'
    : `${pathname.replace(/^\//, '')}${pathname.endsWith('/') ? 'index.html' : ''}`
const pageCache = new Map()
const getHtml = (pathname) => {
  if (!pageCache.has(pathname))
    pageCache.set(pathname, read(pageFile(pathname)))
  return pageCache.get(pathname)
}
const meta = (html, key) =>
  tags(html, 'meta').find((tag) => tag.name === key || tag.property === key)
    ?.content
const expectedUrls = approvedLocales.map(
  (locale) => `${origin}${pagePath(locale)}`,
)

const publicCatalog = JSON.parse(read('catalog.json'))
assert.deepEqual(Object.keys(publicCatalog).sort(), [
  'locales',
  'schemaVersion',
  'sourceUrl',
])
assert.equal(publicCatalog.schemaVersion, 1)
assert.equal(publicCatalog.sourceUrl, `${origin}/`)
assert.deepEqual(Object.keys(publicCatalog.locales), approvedLocales)

for (const locale of approvedLocales) {
  const catalog = source(locale)
  assert.deepEqual(
    publicCatalog.locales[locale],
    catalog,
    `${locale}: 公開JSONと正本が異なります`,
  )
  const path = pagePath(locale)
  const html = getHtml(path)
  const links = tags(html, 'link')
  assert.equal(tags(html, 'html')[0].lang, htmlLangMap[locale])
  assert.equal(
    decode(html.match(/<title>(.*?)<\/title>/s)[1]),
    `${catalog.title} | ${catalog.seoTitleContext}`,
  )
  assert.equal(meta(html, 'description'), catalog.description)
  assert.equal(meta(html, 'robots'), 'index, follow')
  assert.equal(
    links.find((link) => link.rel === 'canonical')?.href,
    `${origin}${path}`,
  )
  const alternates = links.filter(
    (link) => link.rel === 'alternate' && link.hreflang,
  )
  assert.deepEqual(
    Object.fromEntries(alternates.map((link) => [link.hreflang, link.href])),
    {
      ...Object.fromEntries(
        approvedLocales.map((language) => [
          htmlLangMap[language],
          `${origin}${pagePath(language)}`,
        ]),
      ),
      'x-default': `${origin}/`,
    },
  )
  assert.equal(meta(html, 'og:url'), `${origin}${path}`)
  assert.equal(meta(html, 'og:locale'), ogLocaleMap[locale])
  assert.equal(
    meta(html, 'og:title'),
    `${catalog.title} | ${catalog.seoTitleContext}`,
  )
  assert.equal(meta(html, 'og:description'), catalog.description)
  assert.equal(meta(html, 'og:image'), `${origin}/uploads/og-default.png`)
  assert.equal(meta(html, 'twitter:card'), 'summary_large_image')
  const cards = [...html.matchAll(/<article\b([^>]*)>(.*?)<\/article>/gs)]
  assert.equal(cards.length, 13)
  for (const [index, service] of catalog.groups
    .flatMap((group) => group.services)
    .entries()) {
    const card = cards[index]
    assert.equal(attributes(card[1])['data-service-id'], service.id)
    assert.equal(approvedPrices[service.id], service.price)
    assert.equal(
      tags(card[2], 'p').find((tag) => tag['data-service-price'])?.[
        'data-service-price'
      ],
      String(service.price),
    )
    assert.ok(
      decode(card[2]).includes(
        catalog.priceLabel.replace(
          '{price}',
          service.price.toLocaleString('ja-JP'),
        ),
      ),
    )
    assert.ok(decode(card[2]).includes(service.title))
    assert.ok(decode(card[2]).includes(service.description))
    const inquiry = new URL(tags(card[2], 'a')[0].href)
    assert.equal(inquiry.origin, 'https://acecore.net')
    assert.equal(
      inquiry.pathname,
      locale === 'ja' ? '/contact/' : `/${locale}/contact/`,
    )
    assert.deepEqual(
      [...inquiry.searchParams],
      [
        ['category', 'service'],
        ['service', 'acecore-design'],
        ['offering', service.id],
      ],
    )
    assert.equal(inquiry.hash, '#contact-form')
  }
  const structured = [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs,
    ),
  ].map((match) => JSON.parse(match[1]))
  const offers = structured
    .flatMap((item) => item['@graph'] ?? [item])
    .find((item) => item['@type'] === 'OfferCatalog')
  assert.ok(offers)
  const entries = offers.itemListElement.flatMap(
    (group) => group.itemListElement,
  )
  assert.equal(entries.length, 13)
  for (const entry of entries) {
    const id = new URL(entry.url).hash.slice(1)
    assert.equal(entry.priceSpecification.minPrice, approvedPrices[id])
    assert.equal(entry.priceSpecification.priceCurrency, 'JPY')
    assert.equal(entry.priceSpecification.valueAddedTaxIncluded, true)
    assert.equal(
      entry.itemOffered.provider['@id'],
      'https://acecore.net/#organization',
    )
  }
  assert.ok(
    tags(html, 'a').some(
      (link) =>
        link.href === 'https://schools.acecore.net/learning/#creative-services',
    ),
  )

  const errorFile = locale === 'ja' ? '404.html' : `${locale}/404/index.html`
  const errorHtml = read(errorFile)
  assert.equal(meta(errorHtml, 'robots'), 'noindex, follow')
  assert.equal(tags(errorHtml, 'html')[0].lang, htmlLangMap[locale])
  assert.equal(
    tags(errorHtml, 'link').filter((link) => link.rel === 'canonical').length,
    0,
  )
  assert.equal(
    tags(errorHtml, 'link').filter((link) => link.hreflang).length,
    0,
  )
  assert.ok(tags(errorHtml, 'a').some((link) => link.href === path))

  for (const document of [html, errorHtml]) {
    for (const link of tags(document, 'a')) {
      const target = new URL(link.href, `${origin}${path}`)
      assert.ok(
        [
          'designs.acecore.net',
          'acecore.net',
          'schools.acecore.net',
          'hatt.acecore.net',
        ].includes(target.hostname),
        `未確認のリンク: ${target}`,
      )
      if (target.origin !== origin) continue
      const targetFile = pageFile(target.pathname)
      assert.ok(
        existsSync(new URL(targetFile, dist)),
        `内部リンクがありません: ${target}`,
      )
      if (target.hash) {
        const targetHtml = getHtml(target.pathname)
        assert.ok(
          tags(targetHtml, '[a-z][a-z0-9-]*').some(
            (tag) => tag.id === decodeURIComponent(target.hash.slice(1)),
          ),
          `アンカーがありません: ${target}`,
        )
      }
    }
    for (const asset of [
      ...tags(document, 'script').map((tag) => tag.src),
      ...tags(document, 'img').map((tag) => tag.src),
      ...tags(document, 'link')
        .filter((tag) => ['stylesheet', 'icon'].includes(tag.rel))
        .map((tag) => tag.href),
    ].filter(Boolean)) {
      const url = new URL(asset, origin)
      assert.equal(url.origin, origin)
      assert.ok(
        existsSync(new URL(url.pathname.slice(1), dist)),
        `アセットがありません: ${asset}`,
      )
    }
  }
}

const sitemapIndex = read('sitemap-index.xml')
const sitemapFiles = [...sitemapIndex.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => new URL(decode(match[1])).pathname.slice(1),
)
assert.ok(sitemapFiles.length > 0)
const sitemapUrls = sitemapFiles.flatMap((path) =>
  [...read(path).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    decode(match[1]),
  ),
)
assert.deepEqual(sitemapUrls.sort(), [...expectedUrls].sort())
assert.ok(read('robots.txt').includes(`Sitemap: ${origin}/sitemap-index.xml`))
assert.ok(read('_headers').includes('Access-Control-Allow-Origin: *'))
assert.ok(existsSync(new URL('uploads/og-default.png', dist)))
console.log(
  `出力検証OK: 13料金 × 9言語、公開JSON、問い合わせ、内部リンク、SEO、sitemap、404 (${fileURLToPath(dist)})`,
)
