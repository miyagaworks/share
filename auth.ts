// auth.ts (永久利用権判定統一修正版)
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
    subscriptionStatus?: string | null;
  }
}

// 🔥 永久利用権プラン種別を判定する統一関数（Dashboard APIと同じロジック）
function determinePermanentPlanType(user: any): string {
  // サブスクリプション情報から判定
  if (user.subscription?.plan) {
    const plan = user.subscription.plan.toLowerCase();

    if (plan.includes('permanent_enterprise') || plan.includes('enterprise')) {
      return 'enterprise';
    } else if (plan.includes('permanent_business') || plan.includes('business')) {
      return 'business';
    } else if (
      plan.includes('business_plus') ||
      plan.includes('business-plus') ||
      plan.includes('businessplus')
    ) {
      return 'business'; // 旧business_plusはbusinessにマッピング
    } else if (plan.includes('permanent_starter') || plan.includes('starter')) {
      return 'starter';
    } else if (plan.includes('permanent_personal') || plan.includes('personal')) {
      return 'personal';
    }
  }

  // テナント情報から判定
  if (user.adminOfTenant || user.tenant) {
    const tenant = user.adminOfTenant || user.tenant;
    const maxUsers = tenant?.maxUsers || 10;

    if (maxUsers >= 50) {
      return 'enterprise';
    } else if (maxUsers >= 30) {
      return 'business';
    } else {
      return 'starter';
    }
  }

  return 'personal';
}

// NextAuth設定
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: process.env.SESSION_TIMEOUT_HOURS
      ? parseInt(process.env.SESSION_TIMEOUT_HOURS) * 60 * 60
      : 8 * 60 * 60,
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
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🚀 SignIn callback started', {
        provider: account?.provider,
        userEmail: user?.email,
        userId: user?.id,
      });

      try {
        if (account?.provider === 'google' && user?.email) {
          const email = user.email.toLowerCase();
          console.log('📧 Processing Google login for:', email);

          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              subscriptionStatus: true,
              corporateRole: true,
            },
          });

          if (existingUser) {
            console.log('✅ Existing user found:', existingUser.id);
            user.id = existingUser.id;
            user.name = existingUser.name || user.name;
            user.email = existingUser.email;
            return true;
          }

          if (email === 'admin@sns-share.com') {
            console.log('👑 Admin user detected');
            return true;
          }

          if (process.env.NODE_ENV === 'development' && process.env.ALLOW_ALL_USERS === 'true') {
            console.log('🌍 All users allowed (development mode)');
            return true;
          }

          console.log('🆕 Creating new user for Google login');
          try {
            const newUser = await prisma.user.create({
              data: {
                email: email,
                name: user.name || profile?.name || 'Google User',
                image: user.image || profile?.picture || null,
                emailVerified: new Date(),
                subscriptionStatus: 'trial',
              },
            });

            console.log('✅ New user created:', newUser.id);
            user.id = newUser.id;
            user.name = newUser.name;
            user.email = newUser.email;
            return true;
          } catch (createError) {
            console.error('❌ Failed to create new user:', createError);

            const invitedUser = await prisma.passwordResetToken.findFirst({
              where: {
                user: {
                  email: email,
                },
              },
              include: {
                user: true,
              },
            });

            if (invitedUser) {
              console.log('📨 Invited user found');
              user.id = invitedUser.user.id;
              user.name = invitedUser.user.name;
              user.email = invitedUser.user.email;
              return true;
            }

            console.log('🚫 User not authorized');
            return false;
          }
        }

        console.log('✅ Non-Google login approved');
        return true;
      } catch (error) {
        console.error('💥 SignIn callback error:', error);
        return false;
      }
    },

    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.sub = user.id;
          token.name = user.name;
          token.email = user.email;
        }

        if ((user || trigger === 'update') && token.sub) {
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
                  maxUsers: true, // 🔥 追加
                },
              },
              tenant: {
                select: {
                  id: true,
                  accountStatus: true,
                  maxUsers: true, // 🔥 追加
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
            const userEmail = dbUser.email.toLowerCase();
            token.subscriptionStatus = dbUser.subscriptionStatus;

            // ロール判定
            if (userEmail === 'admin@sns-share.com') {
              token.role = 'super-admin';
              token.isAdmin = true;
              token.tenantId = `admin-tenant-${token.sub}`;
            } else if (dbUser.subscriptionStatus === 'permanent') {
              // 🔥 修正: 永久利用権ユーザーのプラン種別を統一ロジックで判定
              const permanentPlanType = determinePermanentPlanType(dbUser);

              console.log('🔥 永久利用権ユーザー判定:', {
                userId: token.sub,
                email: userEmail,
                permanentPlanType,
                subscription: dbUser.subscription?.plan,
                hasAdminTenant: !!dbUser.adminOfTenant,
                hasTenant: !!dbUser.tenant,
              });

              // 🔥 修正: プラン種別に応じて正確にロールを設定
              if (permanentPlanType === 'personal') {
                token.role = 'permanent-personal';
                token.isAdmin = false;
                token.tenantId = null;
              } else {
                // starter, business, enterprise は法人プラン
                token.role = 'permanent-admin';
                token.isAdmin = true;
                token.tenantId = `virtual-tenant-${token.sub}`;
              }
            } else if (dbUser.adminOfTenant) {
              const isActive = dbUser.adminOfTenant.accountStatus !== 'suspended';
              token.role = isActive ? 'admin' : 'personal';
              token.isAdmin = isActive;
              token.tenantId = isActive ? dbUser.adminOfTenant.id : null;
            } else if (dbUser.corporateRole === 'member' && dbUser.tenant) {
              const isActive = dbUser.tenant.accountStatus !== 'suspended';
              token.role = isActive ? 'member' : 'personal';
              token.isAdmin = false;
              token.tenantId = isActive ? dbUser.tenant.id : null;
            } else {
              token.role = 'personal';
              token.isAdmin = false;
              token.tenantId = null;
            }
          } else {
            token.role = 'personal';
            token.isAdmin = false;
            token.tenantId = null;
          }
        }

        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.sub as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
          session.user.role = token.role as string;
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
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