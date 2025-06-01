// app/dashboard/links/components/ClientSnsForm.tsx
"use client";
import React from "react";
import { SNSLinkFormWithGuideIntegration } from "@/components/forms/SNSLinkFormWithGuideIntegration";
import { useRouter } from "next/navigation";
interface ClientSnsFormProps {
    existingPlatforms: string[];
}
export function ClientSnsForm({ existingPlatforms }: ClientSnsFormProps) {
    const router = useRouter();
    const handleSuccess = () => {
        // フォーム送信成功時にページをリフレッシュ
        router.refresh();
    };
    return (
        <SNSLinkFormWithGuideIntegration
            onSuccess={handleSuccess}
            existingPlatforms={existingPlatforms}
        />
    );
}