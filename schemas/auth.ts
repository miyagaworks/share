// schemas/auth.ts
import { z } from "zod";

// ログインフォーム用スキーマ
export const LoginSchema = z.object({
    email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
    password: z.string().min(8, { message: "パスワードは8文字以上である必要があります" }),
});

// 新規登録フォーム用スキーマ
export const RegisterSchema = z.object({
    name: z.string().min(1, { message: "名前を入力してください" }),
    email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
    password: z.string().min(8, { message: "パスワードは8文字以上である必要があります" }),
});

// プロフィール用スキーマ - カラーコード検証を緩和
export const ProfileSchema = z.object({
    name: z.string().min(1, "名前は必須です").optional(),
    nameEn: z.string().optional().nullable(),
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
});

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