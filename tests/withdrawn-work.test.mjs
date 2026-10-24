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
    ['harushiyu-avatar', 'moku', 'bright-friend', 'letter', 'buying-mittens'],
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

test('centipede is archived; Harushiyu is first exactly once with unchanged hero metadata', () => {
  const metadata = read('../archive/withdrawn/centipede/metadata.json')
  const image = readFileSync(
    new URL('../archive/withdrawn/centipede/centipede.webp', import.meta.url),
  )
  assert.equal(
    createHash('sha256').update(image).digest('hex'),
    metadata.imageSha256,
  )
  assert.equal(
    existsSync(
      new URL('../public/portfolio/hatt/centipede.webp', import.meta.url),
    ),
    false,
  )
  assert.equal(portfolioWorks[0].id, homeHeroWork.id)
  assert.deepEqual(portfolioWorks[0].image, homeHeroWork.image)
  assert.equal(
    portfolioWorks.some((work) => work.kind === 'illustration'),
    false,
  )
  for (const locale of locales) {
    const ui = read(`../src/content/ui/${locale}.json`),
      catalog = read(`../src/content/catalog/${locale}.json`),
      context = buildAiContext(locale, catalog, ui)
    assert.equal(ui.portfolio.works.centipede, undefined)
    assert.equal(context.featuredWork, undefined)
    assert.deepEqual(
      context.works.map((work) => work.id),
      ['harushiyu-avatar', 'moku', 'bright-friend', 'letter', 'buying-mittens'],
    )
    assert.equal(
      context.works.filter((work) => work.id === homeHeroWork.id).length,
      1,
    )
    assert.equal(context.works[0].sourceUrl, homeHeroWork.sourceUrl)
    assert.equal(
      JSON.stringify(context).includes(metadata.translations[locale].title),
      false,
    )
    assert.equal(
      legacyTargets(locale, catalog)['work-centipede'],
      locale === 'ja' ? '/works/' : `/${locale}/works/`,
    )
  }
})
