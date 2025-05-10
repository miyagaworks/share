// app/auth/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// フォームのバリデーションスキーマ
const ForgotPasswordSchema = z.object({
    email: z.string().email("有効なメールアドレスを入力してください"),
});

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: {
            email: "",
        },
        mode: "onChange" // リアルタイムバリデーション
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setError(null);
            setSuccess(null);
            setIsPending(true);

            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {
                setError(responseData.message || "パスワードリセットリクエスト中にエラーが発生しました。");
                return;
            }

            setSuccess("パスワードリセット用のリンクをメールで送信しました。メールをご確認ください。");
        } catch (error) {
            console.error("パスワードリセットエラー:", error);
            setError("リクエスト処理中にエラーが発生しました。");
        } finally {
            setIsPending(false);
        }
    };

    return (
      <div className="flex min-h-screen">
        {/* 左側：デコレーション部分 */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-700 opacity-20">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
          </div>
          <div className="z-10 max-w-md text-center">
            <h1 className="text-4xl font-bold text-white mb-6">Share</h1>
            <p className="text-xl text-white/90 mb-8">シンプルにつながる、スマートにシェア。</p>
            <div className="flex flex-col space-y-4 mt-12">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <p className="text-white text-left mb-3">
                  「Share」を使えば、あなたのSNSアカウントと連絡先情報をひとつにまとめて、簡単に共有できます。
                </p>
                <p className="text-white/80 text-left">
                  QRコードでシェアして、ビジネスでもプライベートでも人とのつながりを簡単に。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：パスワードリセットフォーム */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="md:hidden flex justify-center mb-8">
                <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">パスワードをお忘れの方</h2>
              <p className="mt-2 text-gray-600">
                登録したメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 mr-2 text-red-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-200 shadow-sm">
                  <div className="flex items-center">
                    <svg
                      className="h-8 w-8 mr-2 text-green-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p>{success}</p>
                      <p className="mt-1 text-xs text-green-700 text-justify">
                        ※メールが届かない場合は、迷惑メールフォルダもご確認ください。
                        数分経っても届かない場合は、メールアドレスをご確認の上、再度お試しください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Input
                  label="メールアドレス"
                  type="email"
                  placeholder="example@example.com"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={isPending}
                  className="bg-white shadow-sm"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  className={`w-full text-white transition-colors shadow-md ${
                    isValid
                      ? 'bg-blue-600 hover:bg-blue-800 transform hover:-translate-y-0.5'
                      : 'bg-blue-300 hover:bg-blue-400'
                  }`}
                  disabled={isPending || !isValid}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      送信中...
                    </span>
                  ) : (
                    'リセットリンクを送信'
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center text-sm mt-8">
              <Link
                href="/auth/signin"
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                ログイン画面に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
}