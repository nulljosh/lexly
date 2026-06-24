export const config = { matcher: '/school/:path*' };

export default function middleware(request) {
  const expected = 'Basic ' + btoa(`school:${process.env.SCHOOL_PASSWORD}`);
  if (request.headers.get('authorization') !== expected) {
    return new Response('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="School"' },
    });
  }
}
