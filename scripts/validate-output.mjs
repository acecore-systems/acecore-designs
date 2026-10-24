import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { approvedLocales, approvedPrices } from '../tests/approved-services.mjs'
import { htmlLangMap, ogLocaleMap, inquiryUrl } from '../src/data/locales.mjs'
import { homeHeroWork, portfolioWorks } from '../src/data/portfolio.mjs'
import {
  routeKeys,
  groupIds,
  routePath,
  servicePath,
  legacyTargets,
} from '../src/data/routes.mjs'

const origin = 'https://designs.acecore.net'
const dist = new URL('../dist/', import.meta.url)
const read = (path) => readFileSync(new URL(path, dist), 'utf8')
const source = (folder, locale) =>
  JSON.parse(
    readFileSync(
      new URL(`../src/content/${folder}/${locale}.json`, import.meta.url),
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
const elements = (html, tag) =>
  [
    ...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>(.*?)<\\/${tag}>`, 'gs')),
  ].map((match) => ({ attributes: attributes(match[1]), html: match[2] }))
const fileFor = (path) =>
  path === '/'
    ? 'index.html'
    : path.slice(1) + (path.endsWith('/') ? 'index.html' : '')
const cache = new Map()
const getHtml = (path) => {
  if (!cache.has(path)) cache.set(path, read(fileFor(path)))
  return cache.get(path)
}
const ids = new Map()
const getIds = (path) => {
  if (!ids.has(path))
    ids.set(
      path,
      new Set(
        [...getHtml(path).matchAll(/\bid="([^"]*)"/g)].map((match) =>
          decode(match[1]),
        ),
      ),
    )
  return ids.get(path)
}
const meta = (html, key) =>
  tags(html, 'meta').find((tag) => tag.name === key || tag.property === key)
    ?.content
const absolute = (path) => new URL(path, origin).href
const normalize = (text) =>
  decode(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
const portfolioUrls = new Set(
  portfolioWorks.flatMap((work) =>
    [work.sourceUrl, work.workUrl].filter(Boolean),
  ),
)
const images = new Set([
  ...portfolioWorks.filter((work) => work.image).map((work) => work.image.src),
  homeHeroWork.image.src,
])
const expectedUrls = approvedLocales.flatMap((locale) =>
  routeKeys.map((route) => absolute(routePath(locale, route))),
)
let legacyChecks = 0

const validateInternal = (value, path) => {
  const target = new URL(value, absolute(path))
  if (target.origin !== origin) return
  assert.ok(
    existsSync(new URL(fileFor(target.pathname), dist)),
    `内部リンク: ${target}`,
  )
  if (target.hash)
    assert.ok(
      getIds(target.pathname).has(decodeURIComponent(target.hash.slice(1))),
      `アンカー: ${target}`,
    )
}
const validateLinks = (html, path) => {
  for (const link of tags(html, 'a')) {
    const target = new URL(link.href, absolute(path))
    assert.ok(
      [
        'designs.acecore.net',
        'acecore.net',
        'schools.acecore.net',
        'hatt.acecore.net',
      ].includes(target.hostname) || portfolioUrls.has(target.href),
      `未確認の外部リンク: ${target}`,
    )
    validateInternal(link.href, path)
  }
  const assets = [
    ...tags(html, 'script').map((tag) => tag.src),
    ...tags(html, 'img').map((tag) => tag.src),
    ...tags(html, 'link')
      .filter((tag) => ['stylesheet', 'icon'].includes(tag.rel))
      .map((tag) => tag.href),
  ].filter(Boolean)
  for (const value of assets) {
    const url = new URL(value, origin)
    assert.equal(url.origin, origin)
    assert.ok(
      existsSync(new URL(url.pathname.slice(1), dist)),
      `アセット: ${value}`,
    )
  }
  for (const image of tags(html, 'img')) {
    if (['/favicon.svg', '/logo.svg', '/logo-on-dark.svg'].includes(image.src))
      continue
    assert.ok(images.has(image.src), `未確認の画像: ${image.src}`)
    assert.ok(image.alt?.trim())
    assert.ok(Number(image.width) > 0 && Number(image.height) > 0)
    assert.ok(['lazy', 'eager'].includes(image.loading))
  }
}
const validateService = (
  content,
  service,
  locale,
  catalog,
  pricing = false,
) => {
  for (const value of [
    service.title,
    service.description,
    catalog.priceLabel.replace(
      '{price}',
      service.price.toLocaleString('ja-JP'),
    ),
  ])
    assert.ok(
      decode(content).includes(value),
      `${locale}: ${service.id} の正本`,
    )
  const price = tags(content, pricing ? 'td' : 'p').find(
    (tag) => tag['data-service-price'],
  )
  assert.equal(
    price?.['data-service-price'],
    String(approvedPrices[service.id]),
  )
  assert.ok(
    tags(content, 'a').some(
      (link) => link.href === inquiryUrl(locale, service.id),
    ),
    `${locale}: ${service.id} の相談先`,
  )
}
const validateLegacy = (html, locale, catalog) => {
  const script = elements(html, 'script').find((script) =>
    script.html.includes('followLegacyLink'),
  )?.html
  assert.ok(script, `${locale}: 旧リンク転送スクリプト`)
  const targets = legacyTargets(locale, catalog)
  for (const [key, value] of Object.entries(targets)) {
    validateInternal(value, routePath(locale))
    const replacements = []
    const query = '?utm_source=legacy'
    const context = {
      URL,
      location: {
        hash: `#${key}`,
        search: query,
        href: `${absolute(routePath(locale))}${query}#${key}`,
        replace: (value) => replacements.push(value),
      },
      addEventListener: (event, callback) => {
        assert.equal(event, 'hashchange')
        assert.equal(typeof callback, 'function')
      },
    }
    runInNewContext(script, context, { timeout: 1000 })
    const expected = new URL(value, origin)
    assert.deepEqual(
      replacements,
      [expected.pathname + query + expected.hash],
      `${locale}: #${key}`,
    )
    legacyChecks += 1
  }
  for (const key of ['main', 'unknown', '__proto__', 'toString', '%E0%A4%A']) {
    const replacements = []
    runInNewContext(
      script,
      {
        URL,
        location: {
          hash: `#${key}`,
          search: '',
          href: absolute(routePath(locale)),
          replace: (value) => replacements.push(value),
        },
        addEventListener: () => {},
      },
      { timeout: 1000 },
    )
    assert.equal(replacements.length, 0, `${locale}: 未知のhash #${key}`)
  }
  const fallback = elements(html, 'noscript')[0]?.html
  assert.ok(fallback, `${locale}: JavaScript無効時の一覧`)
  const services = catalog.groups.flatMap((group) => group.services)
  assert.equal(tags(fallback, 'a').length, 13)
  for (const service of services)
    assert.ok(
      tags(fallback, 'a').some(
        (link) =>
          link.id === service.id &&
          link.href === servicePath(locale, catalog, service.id),
      ),
    )
}

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
  const catalog = source('catalog', locale)
  const ui = source('ui', locale)
  assert.deepEqual(publicCatalog.locales[locale], catalog)
  for (const route of routeKeys) {
    const path = routePath(locale, route)
    const html = getHtml(path)
    const group = catalog.groups.find((group) => group.id === route)
    const title =
      group?.title ?? (route === 'home' ? catalog.title : ui.site.nav[route])
    const pageTitle =
      route === 'home'
        ? `${catalog.title} | ${catalog.seoTitleContext}`
        : `${title} | Acecore Designs`
    const description = group
      ? ui.site.groups[group.id].intro
      : route === 'home'
        ? catalog.description
        : route === 'services'
          ? ui.site.servicesIntro
          : route === 'works'
            ? ui.portfolio.intro
            : route === 'pricing'
              ? ui.site.pricingIntro
              : catalog.flowBody
    assert.equal(tags(html, 'html')[0].lang, htmlLangMap[locale])
    assert.equal(decode(html.match(/<title>(.*?)<\/title>/s)[1]), pageTitle)
    assert.equal(meta(html, 'description'), description)
    assert.equal(meta(html, 'robots'), 'index, follow')
    assert.equal(elements(html, 'h1').length, 1, `${path}: h1`)
    const h1 =
      route === 'home'
        ? locale === 'ja'
          ? catalog.heroTitle.replace('、', '、\n')
          : catalog.heroTitle
        : title
    assert.equal(
      normalize(elements(html, 'h1')[0].html),
      normalize(h1),
      `${path}: 見出し`,
    )
    const links = tags(html, 'link')
    assert.equal(
      links.find((link) => link.rel === 'canonical')?.href,
      absolute(path),
    )
    assert.deepEqual(
      Object.fromEntries(
        links
          .filter((link) => link.rel === 'alternate')
          .map((link) => [link.hreflang, link.href]),
      ),
      {
        ...Object.fromEntries(
          approvedLocales.map((language) => [
            htmlLangMap[language],
            absolute(routePath(language, route)),
          ]),
        ),
        'x-default': absolute(routePath('ja', route)),
      },
    )
    assert.deepEqual(
      Object.fromEntries(
        tags(html, 'a')
          .filter((link) => link.hreflang)
          .map((link) => [link.hreflang, link.href]),
      ),
      Object.fromEntries(
        approvedLocales.map((language) => [
          htmlLangMap[language],
          routePath(language, route),
        ]),
      ),
      `${path}: 同じページの言語切替`,
    )
    for (const [key, value] of Object.entries({
      'og:url': absolute(path),
      'og:locale': ogLocaleMap[locale],
      'og:title': pageTitle,
      'og:description': description,
      'og:image': `${origin}/uploads/og-default.png`,
      'twitter:card': 'summary_large_image',
    }))
      assert.equal(meta(html, key), value)
    for (const shell of ['header', 'footer']) {
      const content = elements(html, shell)[0].html
      for (const target of ['services', 'works', 'pricing', 'process'])
        assert.ok(
          tags(content, 'a').some(
            (link) => link.href === routePath(locale, target),
          ),
          `${path}: ${shell}→${target}`,
        )
    }
    validateLinks(html, path)
    const graph = elements(html, 'script')
      .filter((script) => script.attributes.type === 'application/ld+json')
      .flatMap((script) => JSON.parse(script.html)['@graph'])
    assert.equal(
      graph.find((entry) => entry['@type'] === 'WebPage')?.url,
      absolute(path),
    )
    if (route !== 'home') {
      const expectedCrumbs = [
        absolute(routePath(locale)),
        ...(group ? [absolute(routePath(locale, 'services'))] : []),
        absolute(path),
      ]
      assert.deepEqual(
        graph
          .find((entry) => entry['@type'] === 'BreadcrumbList')
          ?.itemListElement.map((item) => item.item),
        expectedCrumbs,
      )
    }
    const cards = elements(html, 'article').filter(
      (card) => card.attributes['data-service-id'],
    )
    assert.equal(
      cards.length,
      group ? group.services.length : 0,
      `${path}: 分野別サービス数`,
    )
    if (group) {
      for (const service of group.services) {
        const card = cards.find(
          (card) => card.attributes['data-service-id'] === service.id,
        )
        assert.equal(card.attributes.id, service.id)
        validateService(card.html, service, locale, catalog)
        const work = portfolioWorks
          .filter((work) => work.services.includes(service.id))
          .at(-1)
        assert.equal(
          tags(card.html, 'a').find(
            (link) => link['data-service-work'] === service.id,
          )?.href,
          work ? `${routePath(locale, 'works')}#work-${work.id}` : undefined,
        )
      }
      assert.ok(
        tags(html, 'figure').some(
          (figure) => figure['data-production-diagram'] === group.id,
        ),
      )
      assert.deepEqual(
        tags(html, 'li')
          .filter((item) => item['data-diagram-stage'] !== undefined)
          .map((item) => item['data-diagram-stage']),
        ['0', '1', '2'],
      )
      for (const field of ['input', 'production', 'output'])
        assert.ok(
          decode(html).includes(ui.site.groups[group.id][field]),
          `${path}: 図解 ${field}`,
        )
    }
    if (route === 'pricing') {
      const rows = elements(html, 'tr').filter(
        (row) => row.attributes['data-price-service'],
      )
      assert.equal(rows.length, 13)
      for (const service of catalog.groups.flatMap((group) => group.services)) {
        const row = rows.find(
          (row) => row.attributes['data-price-service'] === service.id,
        )
        validateService(row.html, service, locale, catalog, true)
        assert.ok(
          tags(row.html, 'a').some(
            (link) => link.href === servicePath(locale, catalog, service.id),
          ),
        )
      }
    }
    if (group || route === 'pricing') {
      const offers = graph
        .find((entry) => entry['@type'] === 'OfferCatalog')
        ?.itemListElement.flatMap((entry) => entry.itemListElement)
      assert.equal(offers?.length, group ? group.services.length : 13)
      for (const offer of offers) {
        const id = new URL(offer.url).hash.slice(1)
        assert.equal(offer.url, absolute(servicePath(locale, catalog, id)))
        assert.equal(offer.priceSpecification.minPrice, approvedPrices[id])
        assert.equal(offer.priceSpecification.priceCurrency, 'JPY')
        assert.equal(offer.priceSpecification.valueAddedTaxIncluded, true)
        assert.equal(
          offer.itemOffered.provider['@id'],
          'https://acecore.net/#organization',
        )
      }
    }
    const workCards = elements(html, 'article').filter(
      (card) => card.attributes['data-portfolio-work'],
    )
    const expectedWorks =
      route === 'works'
        ? portfolioWorks
        : route === 'home'
          ? portfolioWorks.filter((work) =>
              ['desert-sketch', 'moku', 'bright-friend'].includes(work.id),
            )
          : group
            ? portfolioWorks.filter((work) =>
                work.services.some((id) =>
                  group.services.some((service) => service.id === id),
                ),
              )
            : []
    assert.equal(workCards.length, expectedWorks.length, `${path}: 制作実績数`)
    for (const work of expectedWorks) {
      const card = workCards.find(
        (card) => card.attributes['data-portfolio-work'] === work.id,
      )
      assert.equal(card.attributes.id, `work-${work.id}`)
      const text = ui.portfolio.works[work.id]
      for (const value of [
        text.title,
        text.description,
        text.deliverable,
        text.credit,
      ])
        assert.ok(decode(card.html).includes(value))
      const workLinks = tags(card.html, 'a')
      assert.equal(
        workLinks.find((link) => link['data-work-inquiry'] === work.id)?.href,
        inquiryUrl(locale, work.offering),
      )
      assert.ok(workLinks.some((link) => link.href === work.sourceUrl))
      if (work.workUrl)
        assert.ok(workLinks.some((link) => link.href === work.workUrl))
      if (route === 'works')
        assert.deepEqual(
          workLinks
            .filter((link) => link['data-work-service'])
            .map((link) => link.href),
          work.services.map((id) => servicePath(locale, catalog, id)),
        )
      else
        assert.ok(
          workLinks.some(
            (link) =>
              link.href === `${routePath(locale, 'works')}#work-${work.id}`,
          ),
        )
      if (work.image) {
        const image = tags(card.html, 'img')[0]
        assert.equal(image.src, work.image.src)
        assert.equal(image.alt, text.alt)
        assert.equal(image.width, String(work.image.width))
        assert.equal(image.height, String(work.image.height))
        assert.equal(image.loading, 'lazy')
      }
    }
    if (route === 'works') {
      assert.ok(getIds(path).has('creator'))
      const cases = graph.find(
        (entry) => entry['@type'] === 'ItemList',
      )?.itemListElement
      assert.equal(cases.length, 6)
      assert.deepEqual(
        cases.map((entry) => entry.item.url),
        portfolioWorks.map((work) => `${absolute(path)}#work-${work.id}`),
      )
    }
    if (route === 'services') {
      const purposeLinks = tags(html, 'a').filter(
        (link) => link['data-purpose-service'],
      )
      assert.equal(purposeLinks.length, 13)
      for (const link of purposeLinks)
        assert.equal(
          link.href,
          servicePath(locale, catalog, link['data-purpose-service']),
        )
    }
    if (route === 'home') {
      validateLegacy(html, locale, catalog)
      const hero = tags(html, 'img').find((image) => image.loading === 'eager')
      assert.equal(hero.src, homeHeroWork.image.src)
      assert.equal(hero.alt, ui.site.heroWork.alt)
      assert.equal(hero.fetchpriority, 'high')
    }
    if (route === 'home' || route === 'process')
      assert.equal(
        tags(html, 'li').filter((item) => item['data-flow-step'] !== undefined)
          .length,
        4,
      )
    if (route === 'process') {
      const faq = elements(html, 'details').filter(
        (details) => details.attributes['data-faq'] !== undefined,
      )
      assert.equal(faq.length, 4)
      assert.ok(
        tags(faq[2].html, 'a').some(
          (link) => link.href === routePath(locale, 'works'),
        ),
      )
      assert.deepEqual(
        graph
          .find((entry) => entry['@type'] === 'FAQPage')
          ?.mainEntity.map((question) => question.name),
        ui.guidance.questions,
      )
      for (const item of ui.guidance.briefItems)
        assert.ok(decode(html).includes(item))
      assert.ok(decode(html).includes(catalog.schoolsBody))
    }
  }
  const errorPath = locale === 'ja' ? '/404.html' : `/${locale}/404/`
  const error = getHtml(errorPath)
  assert.equal(meta(error, 'robots'), 'noindex, follow')
  assert.equal(tags(error, 'html')[0].lang, htmlLangMap[locale])
  assert.equal(
    tags(error, 'link').filter(
      (link) => link.rel === 'canonical' || link.hreflang,
    ).length,
    0,
  )
  assert.equal(
    elements(error, 'script').filter(
      (script) => script.attributes.type === 'application/ld+json',
    ).length,
    0,
  )
  assert.ok(tags(error, 'a').some((link) => link.href === routePath(locale)))
  validateLinks(error, errorPath)
}
const sitemapFiles = [
  ...read('sitemap-index.xml').matchAll(/<loc>(.*?)<\/loc>/g),
].map((match) => new URL(decode(match[1])).pathname.slice(1))
assert.ok(sitemapFiles.length > 0)
const sitemapUrls = sitemapFiles.flatMap((file) =>
  [...read(file).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    decode(match[1]),
  ),
)
assert.deepEqual(sitemapUrls.sort(), [...expectedUrls].sort())
assert.ok(read('robots.txt').includes(`Sitemap: ${origin}/sitemap-index.xml`))
assert.ok(read('_headers').includes('Access-Control-Allow-Origin: *'))
assert.ok(existsSync(new URL('uploads/og-default.png', dist)))
console.log(
  `出力検証OK: 72ページ・9言語、13サービスと料金、6制作実績、図解、法人相談、正本API、全内部リンク、SEO/sitemap、404、旧hash ${legacyChecks}件とno-JS一覧`,
)
