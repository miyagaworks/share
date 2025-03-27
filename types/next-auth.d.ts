// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        role?: string;
    }

    interface Session {
        user: {
            id: string;
            role?: string;
            // 他の既存のプロパティ
            name?: string | null;
            email?: string | null;
            image?: string | null;
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
    }
}