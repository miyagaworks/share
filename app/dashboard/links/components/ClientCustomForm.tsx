// app/dashboard/links/components/ClientCustomForm.tsx
"use client";
import React from "react";
import { CustomLinkForm } from "@/components/forms/CustomLinkForm";
import { useRouter } from "next/navigation";
export function ClientCustomForm() {
    const router = useRouter();
    const handleSuccess = () => {
        // フォーム送信成功時にページをリフレッシュ
        router.refresh();
    };
    return <CustomLinkForm onSuccess={handleSuccess} />;
}