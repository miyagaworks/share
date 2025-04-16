// auth.config.ts
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// ユーザーの型定義
interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  password?: string | null;
  tenantId?: string | null;
  adminOfTenant?: unknown;
  subscription?: {
    plan?: string;
    status?: string;
  };
  // 他の必要なプロパティもここに追加
}

// セッションユーザーの型定義
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  tenantId?: string | null;
  adminOfTenant?: unknown;
  subscription?: {
    plan?: string;
    status?: string;
  };
}

const authConfig: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.log('バリデーションエラー:', validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;

          // メールアドレスを小文字化
          const normalizedEmail = email.toLowerCase();

          console.log(`認証試行: ${normalizedEmail}`);

          // 大文字小文字を区別しないメールアドレス検索
          const user = await prisma.user.findFirst({
            where: {
              email: {
                mode: 'insensitive',
                equals: normalizedEmail,
              },
            },
          });

          if (!user) {
            console.log(`ユーザーが見つかりません: ${normalizedEmail}`);
            return null;
          }

          if (!user.password) {
            console.log(`パスワードが設定されていません（OAuthユーザー？）: ${user.id}`);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {
            console.log(`パスワードが一致しません: ${user.id}`);
            return null;
          }

          console.log(`認証成功: ${user.id}`);
          return user;
        } catch (error) {
          console.error('認証エラー:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // user型をUserにキャスト
        const typedUser = user as User;
        token.user = {
          id: typedUser.id,
          name: typedUser.name,
          email: typedUser.email,
          image: typedUser.image,
          tenantId: typedUser.tenantId,
          adminOfTenant: typedUser.adminOfTenant,
          subscription: typedUser.subscription,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        // anyを避けるために型を明示的に指定
        session.user = token.user as SessionUser;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
};

export default authConfig;