import { inquiryUrl } from './locales.mjs'
import { routePath, servicePath } from './routes.mjs'
import { homeHeroWork, portfolioWorks } from './portfolio.mjs'

// Derived at build time. Catalog and UI remain the only editable content sources.
export function buildAiContext(locale, catalog, copy) {
  const absolute = (path) => new URL(path, 'https://designs.acecore.net/').href
  return {
    schemaVersion: 1,
    sourceUrl: 'https://designs.acecore.net/',
    locale,
    title: catalog.title,
    priceLabel: catalog.priceLabel,
    conditions: catalog.conditionsBody,
    process: catalog.flowBody,
    services: catalog.groups.flatMap((group) =>
      group.services.map((service) => ({
        ...service,
        group: group.title,
        url: absolute(servicePath(locale, catalog, service.id)),
        contactUrl: inquiryUrl(locale, service.id),
      })),
    ),
    works: portfolioWorks.map((work) => ({
      id: work.id,
      title: copy.portfolio.works[work.id].title,
      description: copy.portfolio.works[work.id].description,
      deliverable: copy.portfolio.works[work.id].deliverable,
      credit: copy.portfolio.works[work.id].credit,
      services: work.services,
      url: absolute(`${routePath(locale, 'works')}#work-${work.id}`),
    })),
    featuredWork: {
      id: homeHeroWork.id,
      title: copy.site.heroWork.title,
      credit: copy.site.heroWork.credit,
      url: homeHeroWork.sourceUrl,
    },
    navigation: Object.fromEntries(
      ['home', 'services', 'pricing', 'process', 'works'].map((route) => [
        route,
        absolute(routePath(locale, route)),
      ]),
    ),
    contactUrl: inquiryUrl(locale),
  }
}
