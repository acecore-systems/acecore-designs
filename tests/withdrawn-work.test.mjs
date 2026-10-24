import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { portfolioWorks, homeHeroWork } from '../src/data/portfolio.mjs'
import { legacyTargets } from '../src/data/routes.mjs'
import { buildAiContext } from '../src/data/ai-context.mjs'
import { locales } from '../src/data/locales.mjs'
const read = (p) =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
test('withdrawn work is archived byte-for-byte and excluded from every locale and AI context', () => {
  const metadata = read('../archive/withdrawn/desert-sketch/metadata.json')
  const image = readFileSync(
    new URL(
      '../archive/withdrawn/desert-sketch/desert-sketch.webp',
      import.meta.url,
    ),
  )
  assert.equal(
    createHash('sha256').update(image).digest('hex'),
    metadata.imageSha256,
  )
  assert.equal(
    existsSync(
      new URL('../public/portfolio/hatt/desert-sketch.webp', import.meta.url),
    ),
    false,
  )
  assert.deepEqual(
    portfolioWorks.map((w) => w.id),
    ['centipede', 'moku', 'bright-friend', 'letter', 'buying-mittens'],
  )
  assert.equal(homeHeroWork.id, 'harushiyu-avatar')
  for (const locale of locales) {
    const ui = read(`../src/content/ui/${locale}.json`),
      catalog = read(`../src/content/catalog/${locale}.json`)
    assert.equal(ui.portfolio.works['desert-sketch'], undefined)
    const context = buildAiContext(locale, catalog, ui)
    assert.equal(context.works.length, 5)
    assert.equal(JSON.stringify(context).includes('desert-sketch'), false)
    assert.equal(
      JSON.stringify(context).includes(metadata.translations[locale].title),
      false,
    )
    assert.equal(
      legacyTargets(locale, catalog)['work-desert-sketch'],
      locale === 'ja' ? '/works/' : `/${locale}/works/`,
    )
  }
})
