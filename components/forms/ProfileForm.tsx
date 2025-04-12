// components/forms/ProfileForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileSchema } from "@/schemas/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import type { User, Profile } from "@prisma/client";
import { updateProfile } from "@/actions/profile";
import { z } from "zod";

// 拡張されたProfileSchemaを定義
const ExtendedProfileSchema = ProfileSchema.extend({
    // 空文字列の場合はnullに変換し、値がある場合はURLバリデーション
    companyUrl: z.string()
        .transform(val => val === "" ? null : val) // 空文字列をnullに変換
        .refine(val => val === null || /^https?:\/\//i.test(val), {
            message: "有効なURLを入力してください"
        })
        .optional()
        .nullable(),
    companyLabel: z.string().optional().nullable(),
});

type FormData = z.infer<typeof ExtendedProfileSchema>;

interface ProfileFormProps {
    user: User & { profile?: Profile | null };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [image, setImage] = useState<string | null>(user.image || null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(ExtendedProfileSchema),
        defaultValues: {
            name: user.name || "",
            nameEn: user.nameEn || "",
            bio: user.bio || "",
            phone: user.phone || "",
            company: user.company || "",
            companyUrl: (user as unknown as { companyUrl?: string | null }).companyUrl || "",
            companyLabel: (user as unknown as { companyLabel?: string | null }).companyLabel || "会社HP",
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsPending(true);

            // 会社URLの処理
            let processedCompanyUrl = data.companyUrl?.trim() || null;
            if (processedCompanyUrl && !/^https?:\/\//i.test(processedCompanyUrl)) {
                processedCompanyUrl = `https://${processedCompanyUrl}`;
            }

            // 画像が変更されていたら、imageも送信
            const profileData = {
                ...data,
                companyUrl: processedCompanyUrl, // 処理したURLを使用
                image: image !== user.image ? image : undefined,
            };

            const response = await updateProfile(profileData);

            if (response.error) {
                throw new Error(response.error);
            }

            toast.success("プロフィールを更新しました");
            router.refresh();
        } catch (error) {
            toast.error("プロフィールの更新に失敗しました");
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                    <ImageUpload
                        value={image}
                        onChange={(value: string | null) => setImage(value)}
                        disabled={isPending}
                    />
                    <p className="text-sm text-muted-foreground text-justify">
                        クリックして画像をアップロード（JPG, PNG, 最大1MB）
                    </p>
                </div>

                <div>
                    <Input
                        label="名前（日本語）"
                        placeholder="山田 太郎"
                        {...register("name")}
                        error={errors.name?.message}
                        disabled={isPending}
                    />
                </div>

                <div>
                    <Input
                        label="名前（英語/ローマ字）"
                        placeholder="Taro Yamada"
                        {...register("nameEn")}
                        error={errors.nameEn?.message}
                        disabled={isPending}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        自己紹介
                    </label>
                    <textarea
                        className="mt-2 flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="自己紹介（最大300文字）"
                        {...register("bio")}
                        disabled={isPending}
                    />
                    {errors.bio?.message && (
                        <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>
                    )}
                </div>

                <div>
                    <Input
                        label="電話番号"
                        placeholder="090-XXXX-XXXX"
                        {...register("phone")}
                        error={errors.phone?.message}
                        disabled={isPending}
                    />
                </div>

                <div>
                    <Input
                        label="会社/組織名"
                        placeholder="株式会社〇〇"
                        {...register("company")}
                        error={errors.company?.message}
                        disabled={isPending}
                    />
                </div>

                <div>
                    <Input
                        label="会社/組織のWebサイトURL"
                        placeholder="https://example.com"
                        {...register("companyUrl")}
                        error={errors.companyUrl?.message}
                        disabled={isPending}
                    />
                </div>

                <div>
                    <Input
                        label="会社/組織のリンク表示名"
                        placeholder="会社HP"
                        {...register("companyLabel")}
                        error={errors.companyLabel?.message}
                        disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        プロフィールページで表示されるボタンの名前です（デフォルト: 会社HP）
                    </p>
                </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "更新中..." : "プロフィールを更新"}
            </Button>
        </form>
    );
}