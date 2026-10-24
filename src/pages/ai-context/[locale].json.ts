import { catalogs, ui, type Locale } from '../../data/catalog'
import { buildAiContext } from '../../data/ai-context.mjs'

export function getStaticPaths() {
  return Object.keys(catalogs).map((locale) => ({ params: { locale } }))
}

export function GET({ params }: { params: { locale: Locale } }) {
  return new Response(
    JSON.stringify(
      buildAiContext(params.locale, catalogs[params.locale], ui[params.locale]),
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  )
}
