export const onRequest: PagesFunction = async ({ request, params }) => {
  const path = (params.path as string[]).join('/')
  const url = `https://www.anthropic.com/${path}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
