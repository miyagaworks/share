"use client";

// components/dashboard/ProfileUrlDisplay.tsx
import { useEffect, useState } from "react";

interface ClientProfileUrlProps {
    profileUrl: string;
}

export function ClientProfileUrl({ profileUrl }: ClientProfileUrlProps) {
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        // クライアントサイドでのみwindow.location.originにアクセス
        setOrigin(window.location.origin);
    }, []);

    return (
        <p className="text-sm font-medium break-all mt-1">
            {origin}{profileUrl}
        </p>
    );
}