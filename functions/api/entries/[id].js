export async function onRequestGet({ env, params }) {
  const entry = await env.DB.prepare(
    'SELECT id, content, created_at, updated_at FROM entries WHERE id = ?'
  ).bind(params.id).first();
  if (!entry) return new Response('not found', { status: 404 });
  return Response.json(entry);
}

export async function onRequestPut({ env, params, request }) {
  const body = await request.json();
  const content = body && body.content;
  if (!content || typeof content !== 'string') {
    return new Response('content is required', { status: 400 });
  }
  const now = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE entries SET content = ?, updated_at = ? WHERE id = ?'
  ).bind(content, now, params.id).run();
  const entry = await env.DB.prepare(
    'SELECT id, content, created_at, updated_at FROM entries WHERE id = ?'
  ).bind(params.id).first();
  if (!entry) return new Response('not found', { status: 404 });
  return Response.json(entry);
}
