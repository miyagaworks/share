// app/dashboard/links/components/CustomLinkEditForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { HiLink } from "react-icons/hi";
import type { CustomLink } from "@prisma/client";
interface CustomLinkEditFormProps {
    link: CustomLink;
    onCancel: () => void;
    onSuccess: () => void;
}
export function CustomLinkEditForm({ link, onCancel, onSuccess }: CustomLinkEditFormProps) {
    const router = useRouter();
    const [name, setName] = useState(link.name);
    const [url, setUrl] = useState(link.url);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError("リンク名を入力してください");
            return;
        }
        if (!url.trim()) {
            setError("URLを入力してください");
            return;
        }
        // URLが有効かチェック
        try {
            new URL(url);
        } catch {
            setError("有効なURLを入力してください");
            return;
        }
        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/links/custom/${link.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    url,
                }),
            });
            if (!response.ok) {
                const responseText = await response.text();
                let errorMessage = "カスタムリンクの更新に失敗しました";
                try {
                    // JSONとしてパースできる場合
                    const data = JSON.parse(responseText);
                    if (data.error) {
                        errorMessage = data.error;
                    }
                } catch {
                    // JSONではない場合（HTMLなど）
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || "更新処理でエラーが発生しました");
            }
            toast.success("カスタムリンクを更新しました");
            router.refresh();
            onSuccess();
        } catch (error) {
            setError(error instanceof Error ? error.message : "更新中にエラーが発生しました");
            toast.error(error instanceof Error ? error.message : "更新中にエラーが発生しました");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                    <HiLink className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="font-medium">
                        カスタムリンクを編集
                    </p>
                </div>
            </div>
            {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}
            <div>
                <label className="text-sm font-medium block mb-2">
                    リンク名
                </label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ポートフォリオ"
                    disabled={isSubmitting}
                />
            </div>
            <div>
                <label className="text-sm font-medium block mb-2">
                    URL
                </label>
                <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                    disabled={isSubmitting}
                />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    キャンセル
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                            更新中...
                        </div>
                    ) : "更新する"}
                </Button>
            </div>
        </form>
    );
}