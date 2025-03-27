// app/auth/signin/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SigninPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [isEmailFilled, setIsEmailFilled] = useState(false);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isPasswordFilled, setIsPasswordFilled] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onChange" // リアルタイムバリデーション
    });

    const watchEmail = watch("email");
    const watchPassword = watch("password");

    // 入力フィールドの状態を監視
    useEffect(() => {
        // 空白を除去した後の各フィールドの値が空でないかを確認
        const emailValue = watchEmail?.trim() || "";
        const passwordValue = watchPassword || "";

        setIsEmailFilled(emailValue.length > 0);
        setIsPasswordFilled(passwordValue.length > 0);

        // メールアドレスの簡易バリデーション
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsEmailValid(emailRegex.test(emailValue));

        // パスワードの長さチェック
        setIsPasswordValid(passwordValue.length >= 8);

        // すべての条件が満たされていればフォームは有効
        const formIsValid =
            emailValue.length > 0 &&
            emailRegex.test(emailValue) &&
            passwordValue.length >= 8 &&
            !Object.keys(errors).length;

        setIsFormValid(formIsValid);

        console.log("フォーム状態:", {
            メール入力済み: emailValue.length > 0,
            メール有効: emailRegex.test(emailValue),
            パスワード入力済み: passwordValue.length > 0,
            パスワード有効: passwordValue.length >= 8,
            エラーなし: !Object.keys(errors).length,
            フォーム有効: formIsValid,
            zodバリデーション: isValid
        });
    }, [watchEmail, watchPassword, errors, isValid]);

    const onSubmit = async (data: { email: string; password: string }) => {
        try {
            setError(null);
            setIsPending(true);

            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError("メールアドレスまたはパスワードが正しくありません。");
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            setError("ログイン処理中にエラーが発生しました。");
            console.error("ログインエラー:", error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">ログイン</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        アカウントにログインして、SNS情報を管理しましょう
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <Input
                                label="メールアドレス"
                                type="email"
                                placeholder="example@example.com"
                                {...register("email")}
                                error={errors.email?.message}
                                disabled={isPending}
                                className={`bg-white transition-colors ${isEmailFilled && isEmailValid ? 'border-blue-500 focus:border-blue-500' : ''}`}
                            />
                            {isEmailFilled && !isEmailValid && !errors.email?.message && (
                                <p className="text-xs text-amber-600 mt-1">
                                    有効なメールアドレスを入力してください
                                </p>
                            )}
                        </div>

                        <div>
                            <Input
                                label="パスワード"
                                type="password"
                                placeholder="********"
                                {...register("password")}
                                error={errors.password?.message}
                                disabled={isPending}
                                className={`bg-white transition-colors ${isPasswordFilled && isPasswordValid ? 'border-blue-500 focus:border-blue-500' : ''}`}
                            />
                            {isPasswordFilled && !isPasswordValid && !errors.password?.message && (
                                <p className="text-xs text-amber-600 mt-1">
                                    パスワードは8文字以上である必要があります
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className={`w-full text-white transition-colors ${isFormValid
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-blue-300 hover:bg-blue-400"
                                }`}
                            disabled={isPending || !isFormValid}
                        >
                            {isPending ? "ログイン中..." : "ログイン"}
                        </Button>
                    </div>
                </form>

                <div className="pt-4 text-center">
                    <span className="text-xs text-muted-foreground uppercase">
                        または
                    </span>
                </div>

                <div>
                    <Button
                        className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        variant="outline"
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        disabled={isPending}
                    >
                        <Image
                            src="/google-logo.svg"
                            alt="Google"
                            width={20}
                            height={20}
                            className="mr-2"
                        />
                        Googleでログイン
                    </Button>
                </div>

                <div className="text-center text-sm mt-4">
                    アカウントをお持ちでない場合は{" "}
                    <Link
                        href="/auth/signup"
                        className="font-medium text-blue-600 hover:underline"
                    >
                        新規登録
                    </Link>{" "}
                    してください。
                </div>
            </div>
        </div>
    );
}