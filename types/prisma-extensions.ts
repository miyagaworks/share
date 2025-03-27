// types/prisma-extensions.ts
import { User } from "@prisma/client";

/**
 * 拡張されたユーザー型定義
 * Prisma Clientの型定義が更新されるまでの一時的な対応として使用
 */
export interface ExtendedUser extends User {
    companyUrl?: string | null;
    companyLabel?: string | null;
}

/**
 * User型をExtendedUser型に安全に変換する型ガード関数
 */
export function asExtendedUser(user: User): ExtendedUser {
    return user as ExtendedUser;
}