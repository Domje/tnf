export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, content, created_at, updated_at FROM entries ORDER BY created_at DESC'
  ).all();
  return Response.json(results);
}

export async function onRequestPost({ env, request }) {
  const body = await request.json();
  const content = body && body.content;
  if (!content || typeof content !== 'string') {
    return new Response('content is required', { status: 400 });
  }
  const now = new Date().toISOString();
  const { meta } = await env.DB.prepare(
    'INSERT INTO entries (content, created_at, updated_at) VALUES (?, ?, ?)'
  ).bind(content, now, now).run();
  return Response.json({ id: meta.last_row_id, content, created_at: now, updated_at: now }, { status: 201 });
}
