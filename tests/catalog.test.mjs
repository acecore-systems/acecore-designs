import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import test from 'node:test'
import { approvedLocales, approvedPrices } from './approved-services.mjs'
import { locales, inquiryUrl } from '../src/data/locales.mjs'
import { purposeServices } from '../src/data/service-navigation.mjs'
import { portfolioCheckedAt, portfolioWorks } from '../src/data/portfolio.mjs'
import {
  routeKeys,
  groupIds,
  routePath,
  servicePath,
  legacyTargets,
} from '../src/data/routes.mjs'

const readJson = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const ja = readJson('../src/content/catalog/ja.json')
const shape = (value) => {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, shape(nested)]),
    )
  return typeof value
}
const checkText = (value) => {
  if (typeof value === 'string')
    assert.ok(value.trim().length > 0, '文言が空です')
  else if (value && typeof value === 'object')
    Object.values(value).forEach(checkText)
}

test('公開対象は日本語と既存の8翻訳', () => {
  assert.deepEqual(locales, approvedLocales)
})

test('用途別入口から承認済み13サービスを重複なく選べる', () => {
  const ids = purposeServices.flat()
  assert.equal(ids.length, new Set(ids).size)
  assert.deepEqual([...ids].sort(), Object.keys(approvedPrices).sort())
})

test('相談案内は9言語で同じ構造・用途と工程の数を持つ', () => {
  const baseline = readJson('../src/content/ui/ja.json').guidance
  for (const locale of approvedLocales) {
    const guidance = readJson(`../src/content/ui/${locale}.json`).guidance
    assert.deepEqual(shape(guidance), shape(baseline), locale)
    assert.equal(guidance.purposes.length, purposeServices.length)
    assert.equal(guidance.steps.length, guidance.stepDescriptions.length)
    assert.equal(guidance.questions.length, 4)
    checkText(guidance)
  }
})

test('制作実績は出典・実画像・承認済みサービスの相談先を持つ', () => {
  assert.match(portfolioCheckedAt, /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(
    new Set(portfolioWorks.map((work) => work.id)).size,
    portfolioWorks.length,
  )
  for (const kind of ['avatar', 'gimmick', 'writing', 'reading']) {
    assert.ok(
      portfolioWorks.some((work) => work.kind === kind),
      kind,
    )
  }
  for (const work of portfolioWorks) {
    assert.equal(new URL(work.sourceUrl).origin, 'https://hatt.acecore.net')
    assert.ok(work.services.length > 0, work.id)
    assert.equal(new Set(work.services).size, work.services.length, work.id)
    assert.ok(work.services.includes(work.offering), `${work.id}: 相談先の対応`)
    for (const id of work.services)
      assert.ok(Object.hasOwn(approvedPrices, id), id)
    for (const field of [
      'price',
      'priceJpy',
      'priceLabel',
      'boothUrl',
      'checkoutUrl',
    ]) {
      assert.equal(
        work[field],
        undefined,
        `${work.id}: 販売情報を持ち込みません`,
      )
    }
    if (work.workUrl) {
      const url = new URL(work.workUrl)
      assert.equal(url.protocol, 'https:')
      assert.ok(['www.youtube.com', 'ncode.syosetu.com'].includes(url.hostname))
    }
    if (work.image) {
      assert.equal(
        new URL(work.image.originalUrl).origin,
        'https://hatt.acecore.net',
      )
      assert.ok(work.image.src.startsWith('/portfolio/hatt/'))
      const path = new URL(`../public${work.image.src}`, import.meta.url)
      assert.ok(existsSync(path), work.id)
      assert.ok(
        statSync(path).size <
          (work.id === 'harushiyu-avatar' ? 200_000 : 100_000),
        `${work.id}: 画像サイズ`,
      )
      assert.ok(work.image.width > 0 && work.image.height > 0)
    }
  }
})

test('制作実績の内容・成果物・クレジットは9言語で整合する', () => {
  const baseline = readJson('../src/content/ui/ja.json').portfolio
  const ids = portfolioWorks.map((work) => work.id).sort()
  for (const locale of approvedLocales) {
    const copy = readJson(`../src/content/ui/${locale}.json`).portfolio
    assert.deepEqual(shape(copy), shape(baseline), locale)
    assert.deepEqual(Object.keys(copy.works).sort(), ids, locale)
    for (const work of portfolioWorks) {
      const text = copy.works[work.id]
      assert.ok(text.description.trim(), `${locale}: ${work.id} の制作内容`)
      assert.ok(text.deliverable.trim(), `${locale}: ${work.id} の成果物`)
      assert.ok(text.credit.includes('Hatt'), `${locale}: ${work.id}`)
      assert.ok(copy.kinds[work.kind], `${locale}: ${work.kind}`)
      if (work.image)
        assert.ok(text.alt?.trim(), `${locale}: ${work.id} の代替テキスト`)
      if (work.action)
        assert.ok(copy.actions[work.action], `${locale}: ${work.action}`)
    }
    checkText(copy)
  }
})

test('8ページ構成は9言語で重複せず分野別6/4/3サービスへ到達する', () => {
  assert.equal(routeKeys.length, 8)
  const paths = approvedLocales.flatMap((locale) =>
    routeKeys.map((route) => routePath(locale, route)),
  )
  assert.equal(paths.length, 72)
  assert.equal(new Set(paths).size, 72)
  assert.throws(() => routePath('ja', 'unknown'))
  for (const locale of approvedLocales) {
    const catalog = readJson(`../src/content/catalog/${locale}.json`)
    assert.deepEqual(
      catalog.groups.map((group) => group.services.length),
      [6, 4, 3],
    )
    for (const group of catalog.groups) {
      assert.ok(groupIds.includes(group.id))
      for (const service of group.services)
        assert.equal(
          servicePath(locale, catalog, service.id),
          `${routePath(locale, group.id)}#${service.id}`,
        )
    }
    assert.throws(() => servicePath(locale, catalog, 'unknown'))
  }
})

test('旧トップのサービス・実績・工程アンカーは対応ページへ引き継ぐ', () => {
  for (const locale of approvedLocales) {
    const catalog = readJson(`../src/content/catalog/${locale}.json`)
    const targets = legacyTargets(locale, catalog)
    assert.equal(targets.catalog, routePath(locale, 'pricing'))
    assert.equal(targets.creator, routePath(locale, 'works'))
    assert.equal(targets.works, routePath(locale, 'works'))
    assert.equal(targets.flow, `${routePath(locale, 'process')}#flow`)
    for (const service of catalog.groups.flatMap((group) => group.services))
      assert.equal(
        targets[service.id],
        servicePath(locale, catalog, service.id),
      )
    for (const work of portfolioWorks)
      assert.equal(
        targets[`work-${work.id}`],
        `${routePath(locale, 'works')}#work-${work.id}`,
      )
    assert.equal(Object.hasOwn(targets, 'main'), false)
    assert.equal(Object.hasOwn(targets, 'unknown'), false)
    assert.equal(Object.hasOwn(targets, '__proto__'), false)
  }
})

test('ページ案内と分野別の相談材料・制作・成果物は9言語で整合する', () => {
  const baseline = readJson('../src/content/ui/ja.json').site
  for (const locale of approvedLocales) {
    const site = readJson(`../src/content/ui/${locale}.json`).site
    assert.deepEqual(shape(site), shape(baseline), locale)
    assert.deepEqual(Object.keys(site.groups), groupIds)
    assert.equal(site.diagramStages.length, 3)
    assert.equal(site.serviceCount.split('{count}').length, 2)
    checkText(site)
  }
})

for (const locale of approvedLocales) {
  test(`${locale}: 13サービス・承認済み税込開始料金・翻訳構造`, () => {
    const catalog = readJson(`../src/content/catalog/${locale}.json`)
    assert.deepEqual(shape(catalog), shape(ja))
    assert.deepEqual(
      catalog.groups.map((group) => group.id),
      ['illustration', '3d', 'writing-audio'],
    )
    const services = catalog.groups.flatMap((group) => group.services)
    assert.equal(services.length, 13)
    assert.deepEqual(
      Object.fromEntries(
        services.map((service) => [service.id, service.price]),
      ),
      approvedPrices,
    )
    assert.equal(new Set(services.map((service) => service.id)).size, 13)
    assert.equal(catalog.priceLabel.split('{price}').length, 2)
    checkText(catalog)
    checkText(readJson(`../src/content/ui/${locale}.json`))
  })
  test(`${locale}: サービス別の法人窓口リンク`, () => {
    for (const id of Object.keys(approvedPrices)) {
      const url = new URL(inquiryUrl(locale, id))
      assert.equal(url.origin, 'https://acecore.net')
      assert.equal(
        url.pathname,
        locale === 'ja' ? '/contact/' : `/${locale}/contact/`,
      )
      assert.deepEqual(
        [...url.searchParams],
        [
          ['category', 'service'],
          ['service', 'acecore-design'],
          ['offering', id],
        ],
      )
      assert.equal(url.hash, '#contact-form')
    }
  })
}
