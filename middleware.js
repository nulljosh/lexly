export const config = { matcher: '/school/:path*' };

// ponytail: Basic auth only -- see functions/school/_middleware.js. The previous
// `lingo_authed=1` cookie check was forgeable by any client (the cookie is set by
// browser JS), which made this gate decorative.
export default function middleware(request) {
  const password = process.env.SCHOOL_PASSWORD;
  if (password && request.headers.get('authorization') === 'Basic ' + btoa(`school:${password}`)) return;

  return new Response('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="School"' },
  });
}
