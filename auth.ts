// auth.ts (本番用・console.log削除版)
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
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 SignIn callback started', {
          provider: account?.provider,
          userEmail: user?.email,
        });
      }

      try {
        // Credentials認証の場合は常に許可
        if (account?.provider === 'credentials') {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Credentials authentication successful for:', user?.email);
          }
          return true;
        }

        // Google認証の場合の処理
        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase();

          if (process.env.NODE_ENV === 'development') {
            console.log('📧 Processing Google login for:', email);
          }

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
            if (process.env.NODE_ENV === 'development') {
              console.log('👤 既存ユーザー発見:', {
                id: existingUser.id,
                hasPassword: !!existingUser.password,
                accountProviders: existingUser.accounts.map(
                  (a: { provider: string }) => a.provider,
                ),
              });
            }

            const hasGoogleAccount = existingUser.accounts.some(
              (acc: { provider: string }) => acc.provider === 'google',
            );

            if (!hasGoogleAccount) {
              try {
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: profile?.sub || user.id,
                    access_token: '',
                    token_type: 'bearer',
                  },
                });

                if (process.env.NODE_ENV === 'development') {
                  console.log('🔗 Google連携を自動追加しました');
                }
              } catch (accountError) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('⚠️ Google連携追加でエラーが発生しましたが、ログインは許可します');
                }
              }
            }

            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;
            return true;
          }

          // 管理者の場合は常に許可
          if (email === 'admin@sns-share.com') {
            if (process.env.NODE_ENV === 'development') {
              console.log('👑 Admin user detected');
            }
            return true;
          }

          // 🆕 新規ユーザーの場合：新規登録ページからのみ許可
          if (process.env.NODE_ENV === 'development') {
            console.log('🆕 未登録のGoogleユーザー検出');
          }

          // セッションストレージから新規登録フローかどうか確認
          const isFromSignup =
            typeof window !== 'undefined' && sessionStorage.getItem('isSignupFlow') === 'true';

          // フラグをクリア（確認後すぐにクリア）
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('isSignupFlow');
          }

          // 新規登録ページからの場合、または管理者の場合のみアカウント作成を許可
          if (isFromSignup || email === 'admin@sns-share.com') {
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
                  emailVerified: new Date(), // Google認証済みなので即座に認証済み
                },
              });

              // Google アカウント連携を作成
              await prisma.account.create({
                data: {
                  userId: newUser.id,
                  type: 'oauth',
                  provider: 'google',
                  providerAccountId: profile?.sub || user.id,
                  access_token: '',
                  token_type: 'bearer',
                },
              });

              if (process.env.NODE_ENV === 'development') {
                console.log('✅ 新規Googleユーザー作成完了:', newUser.id);
              }

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
            // サインインページからの場合：エラーを返す
            throw new Error('このメールアドレスは登録されていません。新規登録を行ってください。');
          }
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Other provider authentication successful');
        }
        return true;
      } catch (error) {
        console.error('💥 SignIn callback error:', error);
        throw error;
      }
    },

    async jwt({ token, user, account }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 JWT callback', {
          hasUser: !!user,
          hasToken: !!token,
          provider: account?.provider,
          tokenSub: token?.sub,
          userEmail: user?.email || token?.email,
        });
      }

      // 🔧 ログイン時にユーザー情報をトークンに保存
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ JWT: User info saved to token', {
            sub: token.sub,
            email: token.email,
          });
        }
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
              token.role = 'permanent-admin';
            } else if (dbUser.adminOfTenant) {
              token.role = 'admin';
            } else if (dbUser.corporateRole === 'member' && dbUser.tenant) {
              token.role = 'member';
            } else {
              token.role = 'personal';
            }

            if (process.env.NODE_ENV === 'development') {
              console.log('✅ JWT: Role assigned', {
                email: userEmail,
                role: token.role,
                financialAdminRecord: dbUser.financialAdminRecord,
              });
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
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Session callback', {
          hasToken: !!token,
          tokenSub: token?.sub,
          tokenEmail: token?.email,
          tokenRole: token?.role,
        });
      }

      // 🔧 セッションにトークン情報を設定
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Session: User info set', {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
          });
        }
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