// types/prisma-extensions.ts
import { User } from '@prisma/client';

/**
 * 拡張されたユーザー型定義
 * Prisma Clientの型定義が更新されるまでの一時的な対応として使用
 */
export interface ExtendedUser extends User {
  companyUrl: string | null; // 'undefined' を許可しないように修正
  companyLabel: string | null; // 'undefined' を許可しないように修正
  headerText: string | null; // ヘッダーテキスト
  textColor: string | null; // テキストカラー
}

/**
 * User型をExtendedUser型に安全に変換する型ガード関数
 */
export function asExtendedUser(user: User): ExtendedUser {
  // 明示的に型を持つオブジェクトとして変換
  const extendedUser = user as unknown as ExtendedUser;
  return {
    ...extendedUser,
    companyUrl: extendedUser.companyUrl || null,
    companyLabel: extendedUser.companyLabel || null,
    headerText: extendedUser.headerText || null,
    textColor: extendedUser.textColor || null,
  };
}