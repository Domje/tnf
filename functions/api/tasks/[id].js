export async function onRequestPatch({ env, params, request }) {
  const body = await request.json();
  const updates = [];
  const values = [];
  if (typeof body.text === 'string') {
    updates.push('text = ?');
    values.push(body.text);
  }
  if (typeof body.done === 'boolean' || typeof body.done === 'number') {
    updates.push('done = ?');
    values.push(body.done ? 1 : 0);
  }
  if (!updates.length) return new Response('nothing to update', { status: 400 });
  values.push(params.id);
  await env.DB.prepare('UPDATE tasks SET ' + updates.join(', ') + ' WHERE id = ?').bind(...values).run();
  const task = await env.DB.prepare(
    'SELECT id, text, done, created_at FROM tasks WHERE id = ?'
  ).bind(params.id).first();
  if (!task) return new Response('not found', { status: 404 });
  return Response.json(task);
}

export async function onRequestDelete({ env, params }) {
  await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(params.id).run();
  return new Response(null, { status: 204 });
}
