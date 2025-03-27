// components/forms/CustomLinkForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { addCustomLink } from "@/actions/sns";

const CustomLinkSchema = z.object({
    name: z.string().min(1, { message: "リンク名を入力してください" }),
    url: z.string().url({ message: "有効なURLを入力してください" }),
});

type FormData = z.infer<typeof CustomLinkSchema>;

interface CustomLinkFormProps {
    onSuccess: () => void;
}

export function CustomLinkForm({ onSuccess }: CustomLinkFormProps) {
    const [isPending, setIsPending] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(CustomLinkSchema),
        defaultValues: {
            name: "",
            url: "https://",
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsPending(true);

            const response = await addCustomLink({
                name: data.name,
                url: data.url,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            toast.success("カスタムリンクを追加しました");
            reset();
            onSuccess();
        } catch (error) {
            toast.error("カスタムリンクの追加に失敗しました");
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Input
                        label="リンク名"
                        placeholder="ポートフォリオ"
                        {...register("name")}
                        error={errors.name?.message}
                        disabled={isPending}
                    />
                </div>

                <div>
                    <Input
                        label="URL"
                        placeholder="https://example.com"
                        {...register("url")}
                        error={errors.url?.message}
                        disabled={isPending}
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={isPending}
                className="w-full"
            >
                {isPending ? "追加中..." : "カスタムリンクを追加"}
            </Button>
        </form>
    );
}