// auth.ts (元の状態)
import { logger } from "@/lib/utils/logger";
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';
// 型定義の拡張
declare module 'next-auth' {
  interface User {
    role?: string;
    tenantId?: string | null;
    isAdmin?: boolean;
  }
  interface Session {
    user: {
      id: string;
      role?: string;
      tenantId?: string | null;
      isAdmin?: boolean;
    } & DefaultSession['user'];
  }
}
// JWT型の拡張
declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    tenantId?: string | null;
    isAdmin?: boolean;
  }
}
// authConfig設定を取得
const { callbacks: baseCallbacks, ...restAuthConfig } = authConfig;
// セッションタイムアウト設定（秒単位）
const SESSION_MAX_AGE = 8 * 60 * 60; // 8時間（デフォルト）
// 環境変数から設定を読み込み（カスタマイズ可能）
const getSessionMaxAge = (): number => {
  const envValue = process.env.SESSION_TIMEOUT_HOURS;
  if (envValue) {
    const hours = parseInt(envValue, 10);
    if (!isNaN(hours) && hours > 0) {
      return hours * 60 * 60; // 時間を秒に変換
    }
  }
  return SESSION_MAX_AGE;
};
// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    // セッションの最大継続時間を設定
    maxAge: getSessionMaxAge(),
    // セッション更新間隔を設定（この間隔でセッションが延長される）
    updateAge: 24 * 60 * 60, // 24時間（アクティビティがあれば延長）
  },
  // JWT設定
  jwt: {
    // JWTトークンの最大継続時間
    maxAge: getSessionMaxAge(),
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
        // Cookieの有効期限もセッション時間に合わせる
        maxAge: getSessionMaxAge(),
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, ...rest }) {
      // 既存のコールバックとマージ
      if (baseCallbacks?.jwt) {
        token = await baseCallbacks.jwt({ token, user, trigger, ...rest });
      }
      // セッション有効期限チェック
      const now = Math.floor(Date.now() / 1000);
      const maxAge = getSessionMaxAge();
      // トークンの有効期限を設定
      if (!token.exp || token.exp < now) {
        // 期限切れの場合は新しい有効期限を設定
        token.exp = now + maxAge;
        token.iat = now;
      }
      // 最後のアクティビティ時間を記録
      token.lastActivity = now;
      // 初回サインイン時または更新時にユーザー情報をトークンに追加
      if (user || trigger === 'update') {
        try {
          const userId = user?.id || token.sub;
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              tenant: true,
              adminOfTenant: true,
            },
          });
          if (dbUser) {
            token.isAdmin = !!dbUser.adminOfTenant;
            token.tenantId = dbUser.tenant?.id || dbUser.adminOfTenant?.id || null;
            if (dbUser.adminOfTenant) {
              token.role = 'admin';
            } else if (dbUser.tenant && dbUser.corporateRole === 'member') {
              token.role = 'member';
            } else if (dbUser.tenant) {
              token.role = 'corporate-member';
            } else {
              token.role = 'personal';
            }
            logger.debug('[Auth JWT] ユーザー情報更新:', {
              userId: dbUser.id,
              role: token.role,
              tenantId: token.tenantId,
              corporateRole: dbUser.corporateRole,
              sessionExpiry: new Date(token.exp * 1000).toISOString(),
            });
          }
        } catch (error) {
          logger.error('JWTコールバックでのDB取得エラー:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        session.user.tenantId = token.tenantId;
        // セッション有効期限情報を追加（デバッグ用）
        if (token.exp) {
          const expiryDate = new Date(token.exp * 1000);
          logger.debug('[Session] セッション有効期限:', expiryDate.toISOString());
        }
      }
      return session;
    },
  },
  // authConfigから残りの設定を取得
  ...restAuthConfig,
});
// セキュリティ問題発生時の強制ログアウト関数
export const forceSecurityLogout = async (reason: string): Promise<void> => {
  logger.error(`セキュリティ上の理由によるログアウト: ${reason}`);
  await signOut({
    redirect: true,
    redirectTo: '/auth/signin?security=1',
  });
};
// トークン改ざんを検出する機能
export const detectTokenTampering = (token: Record<string, unknown>): boolean => {
  if (!token || typeof token !== 'object') return true;
  if (!token.sub || !token.iat || !token.exp) return true;
  const expTime = token.exp as number;
  if (Date.now() / 1000 > expTime) return true;
  return false;
};
// セッション有効期限チェック関数
export const isSessionExpired = (token: Record<string, unknown>): boolean => {
  if (!token.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return (token.exp as number) < now;
};
// アクティビティベースのセッション延長チェック
export const shouldExtendSession = (token: Record<string, unknown>): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const lastActivity = (token.lastActivity as number) || 0;
  const timeSinceLastActivity = now - lastActivity;
  // 1時間以上非アクティブの場合は延長しない
  const maxInactiveTime = 60 * 60; // 1時間
  return timeSinceLastActivity < maxInactiveTime;
};