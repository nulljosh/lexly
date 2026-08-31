// Constant-time so the comparison cannot be walked character by character. Same shape
// as healstack/functions/api/sync.js.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const password = env.SCHOOL_PASSWORD;

  // ponytail: Basic auth only. The old `lingo_authed=1` cookie shortcut was set by
  // client JS, so anyone could forge it in devtools and walk straight past the gate.
  // Browsers re-send Basic credentials for the realm, so the UX cost is one prompt.
  const expected = password ? 'Basic ' + btoa(`school:${password}`) : null;
  const provided = request.headers.get('authorization') || '';
  if (expected && timingSafeEqual(provided, expected)) {
    return next();
  }

  return new Response('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="School"' },
  });
}
