// auth.ts (シンプル化版 - 型安全)
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';

// 型定義の拡張
declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}

// NextAuth設定 - シンプルで型安全なバージョン
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8時間
  },
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

    async jwt({ token, user, trigger }) {
      // 基本的なユーザー情報設定
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      // 🚀 強化: ロール情報取得（初回またはupdate時のみ）
      if ((user || trigger === 'update') && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              email: true,
              subscriptionStatus: true,
              corporateRole: true,
              adminOfTenant: {
                select: {
                  id: true,
                  accountStatus: true,
                },
              },
              tenant: {
                select: {
                  id: true,
                  accountStatus: true,
                },
              },
              subscription: {
                select: {
                  plan: true,
                  status: true,
                },
              },
            },
          });

          if (dbUser) {
            // 🚀 新機能: 詳細な法人ユーザー判定とロール設定
            const userEmail = dbUser.email.toLowerCase();

            // 1. 管理者メールアドレス
            if (userEmail === 'admin@sns-share.com') {
              token.role = 'super-admin';
              token.isAdmin = true;
              token.tenantId = `admin-tenant-${token.sub}`;
            }

            // 2. 永久利用権ユーザー
            else if (dbUser.subscriptionStatus === 'permanent') {
              token.role = 'permanent-admin';
              token.isAdmin = true;
              token.tenantId = `virtual-tenant-${token.sub}`;
            }

            // 3. 法人管理者
            else if (dbUser.adminOfTenant) {
              const isActive = dbUser.adminOfTenant.accountStatus !== 'suspended';
              if (isActive) {
                token.role = 'admin';
                token.isAdmin = true;
                token.tenantId = dbUser.adminOfTenant.id;
              } else {
                token.role = 'personal';
                token.isAdmin = false;
                token.tenantId = null;
              }
            }

            // 4. 法人招待メンバー
            else if (dbUser.corporateRole === 'member' && dbUser.tenant) {
              const isActive = dbUser.tenant.accountStatus !== 'suspended';
              if (isActive) {
                token.role = 'member';
                token.isAdmin = false;
                token.tenantId = dbUser.tenant.id;
              } else {
                token.role = 'personal';
                token.isAdmin = false;
                token.tenantId = null;
              }
            }

            // 5. 不完全な招待メンバー
            else if (dbUser.corporateRole === 'member' && !dbUser.tenant) {
              token.role = 'incomplete-member';
              token.isAdmin = false;
              token.tenantId = null;
            }

            // 6. 個人ユーザー
            else {
              token.role = 'personal';
              token.isAdmin = false;
              token.tenantId = null;
            }

            console.log('JWT Token Updated:', {
              userId: token.sub,
              email: userEmail,
              role: token.role,
              isAdmin: token.isAdmin,
              tenantId: token.tenantId,
              corporateRole: dbUser.corporateRole,
              hasAdminTenant: !!dbUser.adminOfTenant,
              hasTenant: !!dbUser.tenant,
            });
          } else {
            console.warn('JWT: ユーザーが見つかりません:', { userId: token.sub });
            token.role = 'personal';
            token.isAdmin = false;
            token.tenantId = null;
          }
        } catch (error) {
          console.error('JWT callback DB error:', error);
          token.role = 'personal';
          token.isAdmin = false;
          token.tenantId = null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  providers: authConfig.providers,
  debug: process.env.NODE_ENV === 'development',
});