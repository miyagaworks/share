// app/dashboard/links/components/SnsLinkEditForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { ImprovedSnsIcon } from "@/components/shared/ImprovedSnsIcon";
import { updateSnsLink } from "@/actions/sns";
import { SNS_METADATA, type SnsPlatform } from "@/types/sns";
import type { SnsLink } from "@prisma/client";

// 編集用スキーマ（URL検証のみ）
const EditSnsLinkSchema = z.object({
    username: z.string().optional(),
    url: z.string().url({ message: "有効なURLを入力してください" }),
});

type FormData = z.infer<typeof EditSnsLinkSchema>;

interface SnsLinkEditFormProps {
    link: SnsLink;
    onCancel: () => void;
    onSuccess: () => void;
}

/**
 * LINEのURLからIDを抽出し、正規化されたURLを返す
 * @param url LINEのURL（重複している可能性あり）
 * @returns 正規化されたLINE URL
 */
const simplifyLineUrl = (url: string): string => {
    // 対象の文字列がない場合はそのまま返す
    if (!url) {
        return url;
    }

    // プロトコルがなければ追加（処理を統一するため）
    let processedUrl = url;
    if (processedUrl.startsWith("line.me/")) {
        processedUrl = "https://" + processedUrl;
    }

    // https://line.me/ti/p/の部分を探す
    // 大文字小文字を区別しないように小文字に変換して検索
    const lowerUrl = processedUrl.toLowerCase();
    const baseUrl = "https://line.me/ti/p/";

    if (!lowerUrl.includes("line.me/ti/p/")) {
        return url; // LINE URLでない場合は元のURLを返す
    }

    const idStartPos = lowerUrl.lastIndexOf("line.me/ti/p/") + "line.me/ti/p/".length;

    // IDだけを抽出（URLパラメータは除去）
    let lineId = processedUrl.substring(idStartPos);
    lineId = lineId.split("?")[0].split("#")[0];

    // IDを使って新しいURLを構築
    return `${baseUrl}${lineId}`;
};

export function SnsLinkEditForm({ link, onCancel, onSuccess }: SnsLinkEditFormProps) {
    const [isPending, setIsPending] = useState(false);
    const platform = link.platform as SnsPlatform;
    const isLineLink = platform === "line";

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(EditSnsLinkSchema),
        defaultValues: {
            username: link.username || "",
            url: link.url,
        },
    });

    const watchUrl = watch("url");
    const watchUsername = watch("username");

    // ユーザー名変更時のURL自動生成（LINE以外）
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isLineLink) return;

        const username = e.target.value;
        let url = SNS_METADATA[platform].baseUrl;

        if (platform === "skype") {
            url = `skype:${username}?chat`;
        } else if (platform === "whatsapp") {
            url = `https://wa.me/${username}`;
        } else {
            url = `${url}${username}`;
        }

        setValue("url", url);
    };

    // LINE URLの直接編集時の処理
    const handleLineUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setValue("url", url);

        // LINE URLからユーザー名部分を抽出して保存
        if (url.includes("line.me/ti/p/")) {
            try {
                const urlObj = new URL(url);
                const pathSegments = urlObj.pathname.split('/');
                // line.me/ti/p/の後の部分がユーザー名（ID）
                const lineId = pathSegments[pathSegments.length - 1];
                setValue("username", lineId);
            } catch (error) {
                console.error("Invalid LINE URL", error);
            }
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            setIsPending(true);

            // LINE選択時はURLの簡略化を行う
            let finalUrl = data.url;
            if (isLineLink) {
                finalUrl = simplifyLineUrl(data.url);
                console.log("修正したLINE URL:", finalUrl);
            }

            const response = await updateSnsLink(link.id, {
                username: data.username,
                url: finalUrl,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            toast.success(`${SNS_METADATA[platform].name}のリンクを更新しました`);
            onSuccess();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "SNSリンクの更新に失敗しました";
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="flex items-center gap-2 mb-4">
                <ImprovedSnsIcon platform={platform} size={24} color="primary" />
                <span className="font-medium">
                    {SNS_METADATA[platform]?.name || platform}を編集
                </span>
            </div>

            {/* LINEの場合はURL入力のみ */}
            {isLineLink ? (
                <div>
                    <label className="text-sm font-medium block mb-2">
                        LINEのURL
                    </label>
                    <Input
                        {...register("url")}
                        placeholder="https://line.me/ti/p/..."
                        onChange={handleLineUrlChange}
                        disabled={isPending}
                    />
                    {errors.url?.message && (
                        <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                        LINEのURLは自動的に正規化されます
                    </p>
                </div>
            ) : (
                <>
                    <div>
                        <label className="text-sm font-medium block mb-2">
                            {SNS_METADATA[platform]?.placeholderText || "ユーザー名"}
                        </label>
                        <Input
                            {...register("username")}
                            placeholder={SNS_METADATA[platform]?.placeholderText || "ユーザー名"}
                            onChange={handleUsernameChange}
                            disabled={isPending}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-2">
                            URL
                        </label>
                        <Input
                            {...register("url")}
                            placeholder="https://"
                            disabled={isPending}
                            className={errors.url ? "border-destructive" : ""}
                        />
                        {errors.url?.message && (
                            <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
                        )}
                    </div>
                </>
            )}

            <div className="flex justify-end space-x-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isPending}
                >
                    キャンセル
                </Button>
                <Button
                    type="submit"
                    disabled={isPending || (!watchUsername && !isLineLink) || !watchUrl}
                >
                    {isPending ? "更新中..." : "更新"}
                </Button>
            </div>
        </form>
    );
}