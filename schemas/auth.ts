// schemas/auth.ts
import { z } from "zod";

// ログインフォーム用スキーマ
export const LoginSchema = z.object({
    email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
    password: z.string().min(8, { message: "パスワードは8文字以上である必要があります" }),
});

// メール再送信用スキーマ
export const ResendVerificationEmailSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

// メール認証用スキーマ
export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
});

export type ResendVerificationEmailInput = z.infer<typeof ResendVerificationEmailSchema>;
export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;

// 新規登録フォーム用スキーマ
export const RegisterSchema = z.object({
  // 名前を姓と名で分離
  lastName: z.string().min(1, { message: '姓を入力してください' }),
  firstName: z.string().min(1, { message: '名を入力してください' }),
  // フリガナも姓と名で分離
  lastNameKana: z.string().min(1, { message: '姓（フリガナ）を入力してください' }),
  firstNameKana: z.string().min(1, { message: '名（フリガナ）を入力してください' }),
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string().min(8, { message: 'パスワードは8文字以上である必要があります' }),
});
// プロフィール用スキーマ - カラーコード検証を緩和
export const ProfileSchema = z.object({
  // 姓名分割フィールド
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  lastNameKana: z.string().optional().nullable(),
  firstNameKana: z.string().optional().nullable(),
  
  // 従来のフィールド（互換性のため）
  name: z.string().optional(),  // nullを許可しない
  nameEn: z.string().optional().nullable(),
  nameKana: z.string().optional().nullable(),
  
  // 他のフィールドは変更なし
  bio: z.string().max(300, "自己紹介は300文字以内で入力してください").optional().nullable(),
  image: z.string().optional().nullable(),
  mainColor: z.string()
    .regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/, "有効なカラーコード(#RGB または #RRGGBB)を入力してください")
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  companyUrl: z.string().url({ message: "有効なURLを入力してください" }).optional().nullable(),
  companyLabel: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
}).passthrough(); // 追加のプロパティを許可する

// SNSリンク用スキーマ
export const SnsLinkSchema = z.object({
    platform: z.string().min(1, "プラットフォームを選択してください"),
    username: z.string().optional(),
    url: z.string().url({ message: "有効なURLを入力してください" }),
});

// カスタムリンク用スキーマ
export const CustomLinkSchema = z.object({
    name: z.string().min(1, { message: "リンク名を入力してください" }),
    url: z.string().url({ message: "有効なURLを入力してください" }),
});