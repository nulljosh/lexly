export const config = { matcher: '/school/:path*' };

export default function middleware(request) {
  // Allow if Supabase session cookie is present (set by lingo-app.js after sign-in)
  const cookie = request.cookies.get('lingo_authed');
  if (cookie?.value === '1') return;

  // Fallback: Basic auth for direct access
  const expected = 'Basic ' + btoa(`school:${process.env.SCHOOL_PASSWORD}`);
  if (request.headers.get('authorization') === expected) return;

  return new Response('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="School"' },
  });
}
