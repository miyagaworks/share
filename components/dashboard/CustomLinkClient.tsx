"use client";

// components/dashboard/CustomLinkClient.tsx
"use client";

import { useState } from "react";
import { CustomLinkList } from "@/components/dashboard/CustomLinkList";
import type { CustomLink } from "@prisma/client";

interface CustomLinkClientProps {
    links: CustomLink[];
}

export default function CustomLinkClient({ links }: CustomLinkClientProps) {
    const [key, setKey] = useState("0");

    const handleUpdate = () => {
        // キーを変更して強制的に再レンダリング
        setKey(prev => String(Number(prev) + 1));
    };

    return (
        <CustomLinkList
            key={key}
            links={links}
            onUpdate={handleUpdate}
        />
    );
}