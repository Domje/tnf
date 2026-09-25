export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, text, done, created_at FROM tasks ORDER BY created_at ASC'
  ).all();
  return Response.json(results);
}

export async function onRequestPost({ env, request }) {
  const body = await request.json();
  const text = body && body.text;
  if (!text || typeof text !== 'string') {
    return new Response('text is required', { status: 400 });
  }
  const now = new Date().toISOString();
  const { meta } = await env.DB.prepare(
    'INSERT INTO tasks (text, done, created_at) VALUES (?, 0, ?)'
  ).bind(text, now).run();
  return Response.json({ id: meta.last_row_id, text, done: 0, created_at: now }, { status: 201 });
}
