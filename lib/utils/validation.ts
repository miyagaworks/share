// lib/utils/validation.ts
import { logger } from "@/lib/utils/logger";
import { z } from 'zod';
// HTMLエスケープ用ユーティリティ（XSS対策）
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
// URL安全性チェック
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // 許可されたプロトコルのみ
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};
// UUIDフォーマットのバリデーション
export const isValidUuid = (id: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
};
// ルートパラメータのバリデーション
export const validateRouteParam = (param: string | undefined): string | null => {
  if (!param) return null;
  // 許可された文字のみ
  const safePattern = /^[a-zA-Z0-9_-]+$/;
  if (!safePattern.test(param)) return null;
  return param;
};
// APIリクエストボディのバリデーション
export const validateApiRequest = <T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: '入力データが無効です' };
  }
};