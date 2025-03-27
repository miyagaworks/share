// app/dashboard/links/components/SnsLinkClient.tsx
"use client";

import { useState } from "react";
import { SnsLinkList } from "@/components/dashboard/SnsLinkList";
import type { SnsLink } from "@prisma/client";

interface SnsLinkClientProps {
    links: SnsLink[];
}

export default function SnsLinkClient({ links }: SnsLinkClientProps) {
    const [key, setKey] = useState("0");

    const handleUpdate = () => {
        // キーを変更して強制的に再レンダリング
        setKey(prev => String(Number(prev) + 1));
    };

    return (
        <SnsLinkList
            key={key}
            links={links}
            onUpdate={handleUpdate}
        />
    );
}