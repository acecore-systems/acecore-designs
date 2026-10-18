export const locales = ['ja', 'en', 'zh-cn', 'es', 'pt', 'fr', 'ko', 'de', 'ru']

export const localeLabels = {
  ja: '日本語',
  en: 'English',
  'zh-cn': '简体中文',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  ko: '한국어',
  de: 'Deutsch',
  ru: 'Русский',
}

export const htmlLangMap = {
  ja: 'ja',
  en: 'en',
  'zh-cn': 'zh-CN',
  es: 'es',
  pt: 'pt',
  fr: 'fr',
  ko: 'ko',
  de: 'de',
  ru: 'ru',
}

export const ogLocaleMap = {
  ja: 'ja_JP',
  en: 'en_US',
  'zh-cn': 'zh_CN',
  es: 'es_ES',
  pt: 'pt_BR',
  fr: 'fr_FR',
  ko: 'ko_KR',
  de: 'de_DE',
  ru: 'ru_RU',
}

export const localePath = (locale) => (locale === 'ja' ? '/' : `/${locale}/`)

export const corporateUrl = (locale, path) =>
  new URL(`${localePath(locale)}${path}`, 'https://acecore.net/').href

export const inquiryUrl = (locale, offering) => {
  const url = new URL(corporateUrl(locale, 'contact/'))
  url.searchParams.set('category', 'service')
  url.searchParams.set('service', 'acecore-design')
  if (offering) url.searchParams.set('offering', offering)
  url.hash = 'contact-form'
  return url.href
}
