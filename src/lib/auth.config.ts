import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config used by middleware.
 * Contains NO Prisma, NO bcrypt — those are Node-only.
 * The full provider list lives in `src/lib/auth.ts`.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [], // populated in auth.ts; middleware doesn't need to know
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isPublic = pathname === '/' || pathname === '/login';
      const isApiAuth = pathname.startsWith('/api/auth');

      if (isApiAuth) return true;
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;