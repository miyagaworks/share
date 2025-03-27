"use client";

// app/dashboard/links/LinkClientWrapper.tsx
import React from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";
import type { SnsLink, CustomLink } from "@prisma/client";

// 動的インポート
const SnsLinkClient = dynamic(
    () => import("@/components/dashboard/SnsLinkClient"),
    { ssr: false, loading: () => <LoadingSpinner /> }
);

const CustomLinkClient = dynamic(
    () => import("@/components/dashboard/CustomLinkClient"),
    { ssr: false, loading: () => <LoadingSpinner /> }
);

function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[150px]">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground mt-4">
                リンク情報を読み込んでいます...
            </p>
        </div>
    );
}

interface SnsLinkWrapperProps {
    links: SnsLink[];
}

export function SnsLinkWrapper({ links }: SnsLinkWrapperProps) {
    return <SnsLinkClient links={links} />;
}

interface CustomLinkWrapperProps {
    links: CustomLink[];
}

export function CustomLinkWrapper({ links }: CustomLinkWrapperProps) {
    return <CustomLinkClient links={links} />;
}