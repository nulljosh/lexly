export async function onRequest(context) {
  const { request, next, env } = context;
  const password = env.SCHOOL_PASSWORD;

  // ponytail: Basic auth only. The old `lingo_authed=1` cookie shortcut was set by
  // client JS, so anyone could forge it in devtools and walk straight past the gate.
  // Browsers re-send Basic credentials for the realm, so the UX cost is one prompt.
  if (password && request.headers.get('authorization') === 'Basic ' + btoa(`school:${password}`)) {
    return next();
  }

  return new Response('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="School"' },
  });
}
