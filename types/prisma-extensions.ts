// types/prisma-extensions.ts
import { User } from '@prisma/client';

/**
 * 拡張されたユーザー型定義
 * Prisma Clientの型定義が更新されるまでの一時的な対応として使用
 */
export interface ExtendedUser extends User {
  companyUrl: string | null; // 'undefined' を許可しないように修正
  companyLabel: string | null; // 'undefined' を許可しないように修正
}

/**
 * User型をExtendedUser型に安全に変換する型ガード関数
 */
export function asExtendedUser(user: User): ExtendedUser {
  // 変換時に明示的に null に設定
  return {
    ...user,
    companyUrl: user.companyUrl || null,
    companyLabel: user.companyLabel || null,
  };
}