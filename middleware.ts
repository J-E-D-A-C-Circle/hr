import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets, icons, and API routes pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('pvc_session')?.value;

  // Helper to extract session payload from crypto cookie
  let role: string | null = null;
  if (sessionCookie) {
    try {
      const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
      const parts = decoded.split('::');
      if (parts.length === 2) {
        const payload = JSON.parse(parts[0]);
        if (payload.exp && Date.now() < payload.exp) {
          role = payload.role;
        }
      }
    } catch {
      role = null;
    }
  }

  // Protect Admin and Review routes for HR_ADMIN only
  if (pathname.startsWith('/admin') || pathname.startsWith('/review')) {
    if (!role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== 'HR_ADMIN') {
      return NextResponse.redirect(new URL('/upload', request.url));
    }
  }

  // Protect Compliance view for logged-in users
  if (pathname.startsWith('/compliance')) {
    if (!role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/review', '/compliance'],
};
