import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'pvc-super-secret-jwt-key-2026-development';

async function verifyHmac(payloadStr: string, signatureHex: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payloadStr));
  } catch {
    return false;
  }
}

async function getVerifiedSessionRole(sessionCookie?: string): Promise<{ role: string | null; branchId: string | null }> {
  if (!sessionCookie) return { role: null, branchId: null };
  try {
    const decoded = atob(sessionCookie);
    const lastSepIndex = decoded.lastIndexOf('::');
    if (lastSepIndex === -1) return { role: null, branchId: null };

    const payloadStr = decoded.substring(0, lastSepIndex);
    const hmac = decoded.substring(lastSepIndex + 2);

    const isValid = await verifyHmac(payloadStr, hmac);
    if (!isValid) return { role: null, branchId: null };

    const payload = JSON.parse(payloadStr);
    if (payload.exp && Date.now() > payload.exp) return { role: null, branchId: null };

    return { role: payload.role || null, branchId: payload.branchId || null };
  } catch {
    return { role: null, branchId: null };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets & icons pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('pvc_session')?.value;
  const { role } = await getVerifiedSessionRole(sessionCookie);

  // Protect raw /uploads directory from unauthenticated direct hotlinking
  if (pathname.startsWith('/uploads')) {
    if (!role) {
      return new NextResponse('Unauthorized access to sensitive documents', { status: 401 });
    }
  }

  // Protect Admin routes for HR_ADMIN only
  if (pathname.startsWith('/admin')) {
    if (!role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== 'HR_ADMIN') {
      return NextResponse.redirect(new URL('/upload', request.url));
    }
  }

  // Protect Review routes for HR_ADMIN and FINANCE_OFFICER
  if (pathname.startsWith('/review')) {
    if (!role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== 'HR_ADMIN' && role !== 'FINANCE_OFFICER') {
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
  matcher: ['/admin/:path*', '/review', '/compliance', '/uploads/:path*'],
};
