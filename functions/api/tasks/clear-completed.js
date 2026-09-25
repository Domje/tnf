export async function onRequestPost({ env }) {
  await env.DB.prepare('DELETE FROM tasks WHERE done = 1').run();
  return new Response(null, { status: 204 });
}
