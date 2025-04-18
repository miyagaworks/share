// types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string; // roleプロパティを追加
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tenantId?: string | null;
      isAdmin?: boolean;
      subscription?: {
        status?: string;
        plan?: string;
      };
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role?: string; // roleプロパティを追加
    name?: string | null;
    email?: string | null;
    image?: string | null;
    tenantId?: string | null;
    isAdmin?: boolean;
    subscription?: {
      status?: string;
      plan?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string; // roleプロパティを追加
    tenantId?: string | null;
    isAdmin?: boolean;
    subscription?: {
      status?: string;
      plan?: string;
    };
  }
}