import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';
import { authConfig } from '@/lib/auth.config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      designation?: string | null;
    } & DefaultSession['user'];
  }
  interface User {
    role: Role;
    department?: string | null;
    designation?: string | null;
  }
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          designation: user.designation,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role;
        (token as any).department = (user as any).department;
        (token as any).designation = (user as any).designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token as any).id;
        session.user.role = (token as any).role;
        session.user.department = (token as any).department;
        session.user.designation = (token as any).designation;
      }
      return session;
    },
  },
});