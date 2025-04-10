import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';

const roles = {
  '/dashboard/admin': ['admin'],
  '/dashboard/teacher-control': ['admin', 'teacher'],
  '/dashboard': ['admin', 'teacher'],
  '/dashboard/student': ['student'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = Object.keys(roles).some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === "GET") {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const userRole = parsed.user.role;

      // Sort routes by length descending to match most specific first
      const sortedRoutes = Object.entries(roles).sort(
        ([routeA], [routeB]) => routeB.length - routeA.length,
      );

      const matchedRoute = sortedRoutes.find(([route]) =>
        pathname.startsWith(route),
      );

      const allowedRoles = matchedRoute?.[1];

      console.log(`Path: ${pathname}, Role: ${userRole}, Allowed: ${allowedRoles}`); // Added logging

      if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.error(`Unauthorized access attempt: Path=${pathname}, Role=${userRole}, Allowed=${allowedRoles}`);
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
