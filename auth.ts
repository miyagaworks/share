// auth.ts
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';
import { cookies } from 'next/headers';

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
    isAdmin?: boolean;
    tenantId?: string | null;
  }
}

// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4時間
  },
  jwt: {
    maxAge: 4 * 60 * 60, // 4時間
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 4 * 60 * 60,
      },
    },
  },
  callbacks: {
    // 🔧 カスタムエラーハンドリングを追加
    async redirect({ url, baseUrl }) {
      // エラーページへのリダイレクト時にパラメータを保持
      if (url.includes('/auth/error')) {
        return url;
      }

      // 通常のリダイレクト処理
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'credentials') {
          return true;
        }

        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase();

          // 既存ユーザーチェック
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
              accounts: {
                select: {
                  provider: true,
                },
              },
            },
          });

          if (existingUser) {
            // 既存ユーザーの処理
            const hasGoogleAccount = existingUser.accounts.some(
              (acc: { provider: string }) => acc.provider === 'google',
            );

            if (!hasGoogleAccount) {
              try {
                // Google連携を自動追加
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: profile?.sub || user.id,
                    access_token: account.access_token || '',
                    token_type: account.token_type || 'bearer',
                    id_token: account.id_token || undefined,
                    scope: account.scope || undefined,
                    expires_at: account.expires_at || undefined,
                    refresh_token: account.refresh_token || undefined,
                  },
                });
              } catch (accountError) {
                // アカウント連携エラーは無視してログインを継続
                console.error('Account linking error:', accountError);
              }
            }

            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;
            return true;
          }

          // 🆕 新規ユーザーの場合：Cookieで判定
          const cookieStore = await cookies(); // Next.js 15ではawaitが必要
          const signupCookie = cookieStore.get('is_signup_flow');
          const isSignupFlow = signupCookie?.value === 'true';

          // 管理者メールは常に許可
          const isAdminEmail = email === 'admin@sns-share.com';

          if (isSignupFlow || isAdminEmail) {
            try {
              // 7日間の無料トライアル期間を設定
              const now = new Date();
              const trialEndsAt = new Date(now);
              trialEndsAt.setDate(trialEndsAt.getDate() + 7);

              // 新規ユーザーを作成
              const newUser = await prisma.user.create({
                data: {
                  name: user.name || email.split('@')[0],
                  nameEn: '',
                  nameKana: '',
                  lastName: '',
                  firstName: '',
                  lastNameKana: '',
                  firstNameKana: '',
                  email: email,
                  password: null, // Google認証のためパスワードは不要
                  mainColor: '#3B82F6',
                  trialEndsAt,
                  subscriptionStatus: 'trialing',
                  emailVerified: new Date(),
                },
              });

              // Google アカウント連携を作成
              await prisma.account.create({
                data: {
                  userId: newUser.id,
                  type: 'oauth',
                  provider: 'google',
                  providerAccountId: profile?.sub || user.id,
                  access_token: account.access_token || '',
                  token_type: account.token_type || 'bearer',
                  id_token: account.id_token || undefined,
                  scope: account.scope || undefined,
                  expires_at: account.expires_at || undefined,
                  refresh_token: account.refresh_token || undefined,
                },
              });

              // NextAuth用にユーザー情報を設定
              user.id = newUser.id;
              user.name = newUser.name;
              user.email = newUser.email;

              return true;
            } catch (createError) {
              console.error('💥 新規Googleユーザー作成エラー:', createError);
              throw new Error('アカウントの作成中にエラーが発生しました。もう一度お試しください。');
            }
          } else {
            // サインインページからの場合
            throw new Error(
              'このメールアドレスは登録されていません。新規登録ページから登録してください。',
            );
          }
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        throw error;
      }
    },

    async jwt({ token, user, account }) {

      // 🔧 ログイン時にユーザー情報をトークンに保存
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      // 🔧 ロール情報の取得（初回またはロールがない場合）
      if (token.sub && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              email: true,
              subscriptionStatus: true,
              corporateRole: true,
              financialAdminRecord: {
                // ✅ 正しいリレーション
                select: {
                  isActive: true,
                },
              },
              adminOfTenant: { select: { id: true } },
              tenant: { select: { id: true } },
            },
          });

          if (dbUser) {
            const userEmail = dbUser.email.toLowerCase();

            if (userEmail === 'admin@sns-share.com') {
              token.role = 'super-admin';
            } else if (
              userEmail.endsWith('@sns-share.com') &&
              dbUser.financialAdminRecord?.isActive === true
            ) {
              token.role = 'financial-admin'; // ✅ 正しく判定される
            } else if (dbUser.subscriptionStatus === 'permanent') {
            // 永久利用権ユーザーの場合、プラン種別を確認
            const subscription = await prisma.subscription.findFirst({
              where: { userId: token.sub },
              select: { plan: true }
            });
            
            // permanent_personalプランの場合は個人ユーザーとして扱う
            if (subscription?.plan === 'permanent_personal') {
              token.role = 'personal';
            } else {
              // permanent_starter, permanent_business, permanent_enterpriseの場合
              token.role = 'permanent-admin';
            }
            } else if (dbUser.adminOfTenant) {
              token.role = 'admin';
            } else if (dbUser.corporateRole === 'member' && dbUser.tenant) {
              token.role = 'member';
            } else {
              token.role = 'personal';
            }
          }
        } catch (error) {
          // 🔧 エラーログは本番でも残す
          console.error('❌ JWT callback error:', error);
          token.role = 'personal';
        }
      }

      return token;
    },

    async session({ session, token }) {
      // 🔧 セッションにトークン情報を設定
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
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
  providers: authConfig.providers,
  debug: false, // 🔧 本番では false
});