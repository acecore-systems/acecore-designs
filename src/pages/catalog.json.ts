import { publicCatalog } from '../data/catalog'

export const GET = () =>
  new Response(`${JSON.stringify(publicCatalog)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
