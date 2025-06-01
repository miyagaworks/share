// auth.config.ts (シンプル化版)
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const validatedFields = LoginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;
          const normalizedEmail = email.toLowerCase();

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
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
            name: user.name || '',
            email: user.email,
          };
        } catch (error) {
          console.error('認証エラー:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google' && user?.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true, name: true, email: true },
          });

          if (existingUser) {
            user.id = existingUser.id;
            user.name = existingUser.name;
            user.email = existingUser.email;
            return true;
          }
          return false;
        }
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;