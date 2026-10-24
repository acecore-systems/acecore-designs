import { localePath } from './locales.mjs'
import { portfolioWorks } from './portfolio.mjs'

export const routeSegments = {
  home: '',
  services: 'services',
  illustration: 'services/illustration',
  '3d': 'services/3d',
  'writing-audio': 'services/writing-audio',
  works: 'works',
  pricing: 'pricing',
  process: 'process',
}
export const routeKeys = Object.keys(routeSegments)
export const groupIds = ['illustration', '3d', 'writing-audio']

export const routePath = (locale, route = 'home') => {
  if (!Object.hasOwn(routeSegments, route))
    throw new Error(`Unknown route: ${route}`)
  const segment = routeSegments[route]
  return `${localePath(locale)}${segment ? `${segment}/` : ''}`
}

export const servicePath = (locale, catalog, id) => {
  const group = catalog.groups.find((group) =>
    group.services.some((service) => service.id === id),
  )
  if (!group) throw new Error(`Unknown service: ${id}`)
  return `${routePath(locale, group.id)}#${id}`
}

export const legacyTargets = (locale, catalog) => {
  const targets = {
    catalog: routePath(locale, 'pricing'),
    'catalog-heading': routePath(locale, 'pricing'),
    creator: routePath(locale, 'works'),
    works: routePath(locale, 'works'),
    'works-heading': routePath(locale, 'works'),
    flow: `${routePath(locale, 'process')}#flow`,
    'flow-heading': `${routePath(locale, 'process')}#flow`,
    faq: `${routePath(locale, 'process')}#faq`,
    'faq-heading': `${routePath(locale, 'process')}#faq`,
    'brief-heading': `${routePath(locale, 'process')}#brief-heading`,
    'schools-heading': `${routePath(locale, 'process')}#schools-heading`,
    'purpose-heading': `${routePath(locale, 'services')}#purpose-heading`,
  }
  for (const group of catalog.groups) {
    targets[group.id] = routePath(locale, group.id)
    targets[`${group.id}-heading`] = routePath(locale, group.id)
    for (const service of group.services)
      targets[service.id] = servicePath(locale, catalog, service.id)
  }
  // A withdrawn work's old home fragment leads to the current work list.
  targets['work-desert-sketch'] = routePath(locale, 'works')
  for (const work of portfolioWorks)
    targets[`work-${work.id}`] = `${routePath(locale, 'works')}#work-${work.id}`
  return targets
}
