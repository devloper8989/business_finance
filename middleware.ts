import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parse } from 'cookie';

export function middleware(request: NextRequest) {
  const cookies = parse(request.headers.get('cookie') || '');
  const session = cookies.session;

  const publicPaths = ['/login', '/register', '/'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  // Debug logs
  console.log('Middleware - session:', session);
  console.log('Path:', request.nextUrl.pathname);

  // If no session and trying to access protected route
  if (!session && !isPublicPath) {
    console.log('Redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If has session but trying to access auth page
  if (session && isPublicPath) {
    console.log('Redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};