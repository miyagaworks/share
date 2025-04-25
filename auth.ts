// auth.ts
import NextAuth from 'next-auth';
import { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// NextAuthの型定義に拡張を行う
declare module 'next-auth' {
  interface User {
    role?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role?: string | null;
    } & DefaultSession['user'];
  }
}

// JWTの型拡張
declare module 'next-auth/jwt' {
  interface JWT {
    role?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      async authorize(credentials) {
        try {
          if (!credentials) return null;

          const email = credentials.email as string;
          const password = credentials.password as string;

          if (!email || !password) {
            return null;
          }

          const normalizedEmail = email.toLowerCase();

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              corporateRole: true,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.corporateRole,
          };
        } catch (error) {
          console.error('認証エラー:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ token, session }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
});