import ja from '../content/catalog/ja.json'
import en from '../content/catalog/en.json'
import zhCn from '../content/catalog/zh-cn.json'
import es from '../content/catalog/es.json'
import pt from '../content/catalog/pt.json'
import fr from '../content/catalog/fr.json'
import ko from '../content/catalog/ko.json'
import de from '../content/catalog/de.json'
import ru from '../content/catalog/ru.json'
import jaUi from '../content/ui/ja.json'
import enUi from '../content/ui/en.json'
import zhCnUi from '../content/ui/zh-cn.json'
import esUi from '../content/ui/es.json'
import ptUi from '../content/ui/pt.json'
import frUi from '../content/ui/fr.json'
import koUi from '../content/ui/ko.json'
import deUi from '../content/ui/de.json'
import ruUi from '../content/ui/ru.json'

export const catalogs = { ja, en, 'zh-cn': zhCn, es, pt, fr, ko, de, ru }
export type Locale = keyof typeof catalogs

export const ui = {
  ja: jaUi,
  en: enUi,
  'zh-cn': zhCnUi,
  es: esUi,
  pt: ptUi,
  fr: frUi,
  ko: koUi,
  de: deUi,
  ru: ruUi,
}

export const publicCatalog = {
  schemaVersion: 1,
  sourceUrl: 'https://designs.acecore.net/',
  locales: catalogs,
}

export const serializeJsonForHtml = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
