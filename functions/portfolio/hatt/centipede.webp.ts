// The withdrawn copy must not fall back to a previously cached Pages asset.
// This route affects only its original Designs URL, never the Hatt source.
export const onRequest = () =>
  new Response(null, {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
