export async function onRequest(context) {
  const { request, next, env } = context;
  const cookie = request.headers.get('cookie') || '';
  if (/(?:^|;\s*)lingo_authed=1(?:;|$)/.test(cookie)) return next();

  const expected = 'Basic ' + btoa(`school:${env.SCHOOL_PASSWORD}`);
  if (request.headers.get('authorization') === expected) return next();

  return new Response('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="School"' },
  });
}
