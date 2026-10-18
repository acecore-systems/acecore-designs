import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { approvedLocales, approvedPrices } from './approved-services.mjs'
import { locales, inquiryUrl } from '../src/data/locales.mjs'

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
