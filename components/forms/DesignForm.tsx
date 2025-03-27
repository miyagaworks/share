"use client";

// components/forms/DesignForm.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { EnhancedColorPicker as ColorPicker } from "@/components/ui/EnhancedColorPicker";
import { toast } from "react-hot-toast";
import { updateProfile } from "@/actions/profile";
import { useRouter } from "next/navigation";
import type { User } from "@prisma/client";

// シンプルなスキーマ - サーバー側でも検証されるので最低限に
const DesignSchema = z.object({
    mainColor: z.string()
});

type FormData = z.infer<typeof DesignSchema>;

interface DesignFormProps {
    user: User;
}

export function DesignForm({ user }: DesignFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        handleSubmit,
        setValue,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(DesignSchema),
        defaultValues: {
            mainColor: user.mainColor || "#3B82F6",
        },
    });

    const watchedMainColor = watch("mainColor");

    // エラーがクリアされたらエラーメッセージをリセット
    useEffect(() => {
        if (errorMessage) {
            setErrorMessage(null);
        }
    }, [watchedMainColor, errorMessage]);

    const onSubmit = async (data: FormData) => {
        try {
            setIsPending(true);
            setErrorMessage(null);

            console.log("送信データ:", data); // デバッグ用

            const response = await updateProfile({
                mainColor: data.mainColor,
            });

            if (response.error) {
                setErrorMessage(response.error);
                throw new Error(response.error);
            }

            toast.success("デザイン設定を更新しました");
            router.refresh();
        } catch (error) {
            console.error("Error:", error);
            toast.error(errorMessage || "デザイン設定の更新に失敗しました");
        } finally {
            setIsPending(false);
        }
    };

    // カラーピッカーでの色変更処理
    const handleColorChange = (color: string) => {
        console.log("色の変更:", color); // デバッグ用
        setValue("mainColor", color);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        メインカラー
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 mb-2 text-justify">
                        プロフィールページのアクセントカラーとして使用されます
                    </p>
                    <ColorPicker
                        color={watchedMainColor || "#3B82F6"}
                        onChange={handleColorChange}
                        disabled={isPending}
                    />
                    {errors.mainColor?.message && (
                        <p className="text-sm text-destructive mt-1">{errors.mainColor.message}</p>
                    )}
                    {errorMessage && (
                        <p className="text-sm text-destructive mt-1">{errorMessage}</p>
                    )}
                </div>

                {/* 将来的な拡張のためのプレースホルダー */}
                <div className="border-gray-300 pt-4 mt-4">
                    <p className="text-sm text-muted-foreground text-justify">
                        より高度なカスタマイズオプションは今後のアップデートで追加予定です。
                    </p>
                </div>
            </div>

            <Button
                type="submit"
                disabled={isPending}
                className="w-full"
            >
                {isPending ? "更新中..." : "デザインを更新"}
            </Button>
        </form>
    );
}