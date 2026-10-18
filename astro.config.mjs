import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { htmlLangMap, locales } from './src/data/locales.mjs'

export default defineConfig({
  site: 'https://designs.acecore.net',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'ja',
    locales: [...locales],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.includes('/404'),
      i18n: { defaultLocale: 'ja', locales: htmlLangMap },
    }),
  ],
})
