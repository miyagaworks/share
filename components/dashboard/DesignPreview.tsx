"use client";

// components/dashboard/DesignPreview.tsx
import { useState, useEffect } from "react";
import { getInitials } from "@/lib/utils";
import { ImprovedSnsIcon } from "@/components/shared/ImprovedSnsIcon";
import { type SnsPlatform } from "@/types/sns";
import Image from "next/image";
import type { User } from "@prisma/client";

interface DesignPreviewProps {
    user: User;
}

export function DesignPreview({ user }: DesignPreviewProps) {
    // 親コンポーネントの状態が変更された時に更新するためのキー
    const [key, setKey] = useState(0);
    const [mainColor, setMainColor] = useState(user.mainColor || "#3B82F6");

    // ユーザーのメインカラーが変更されたら更新
    useEffect(() => {
        setMainColor(user.mainColor || "#3B82F6");
        setKey(prev => prev + 1);
    }, [user.mainColor]);

    // テスト用のダミーデータ
    const dummySnsLinks = [
        { platform: "X", name: "X" },
        { platform: "instagram", name: "Instagram" },
        { platform: "youtube", name: "YouTube" },
        { platform: "line", name: "LINE" },
    ];

    return (
        <div key={key} className="overflow-hidden rounded-lg border shadow-sm max-w-xs mx-auto" style={{ transform: "scale(0.9)" }}>
            {/* ヘッダー部分 */}
            <div
                className="h-16 w-full"
                style={{ backgroundColor: mainColor }}
            />

            <div className="p-4 -mt-8">
                {/* プロフィール画像 */}
                <div className="flex justify-center">
                    {user.image ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-background">
                            <Image
                                src={user.image}
                                alt={user.name || "プロフィール"}
                                width={64}  // 適切なサイズを指定
                                height={64} // 適切なサイズを指定
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div
                            className="w-16 h-16 rounded-full border-4 border-background flex items-center justify-center text-lg font-bold"
                            style={{ backgroundColor: mainColor }}
                        >
                            <span className="text-white">
                                {getInitials(user.name || "User")}
                            </span>
                        </div>
                    )}
                </div>

                {/* プロフィール情報 */}
                <div className="mt-3 text-center">
                    <h3 className="font-medium">{user.name || "Your Name"}</h3>
                    {user.nameEn && <p className="text-sm text-muted-foreground">{user.nameEn}</p>}
                    {user.bio && <p className="text-sm mt-1">{user.bio}</p>}
                </div>

                {/* SNSリンク（サンプル） */}
                <div className="mt-4">
                    <div className="grid grid-cols-4 gap-2">
                        {dummySnsLinks.map((link) => (
                            <div
                                key={link.platform}
                                className="flex flex-col items-center justify-center p-2 rounded-md bg-muted"
                            >
                                <ImprovedSnsIcon
                                    platform={link.platform as SnsPlatform}
                                    size={20}
                                    color={mainColor}
                                />
                                <span className="mt-1 text-xs">{link.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* アクションボタン */}
                <div className="mt-4 space-y-2">
                    <div
                        className="p-2 rounded-md text-center text-white text-sm font-medium"
                        style={{ backgroundColor: mainColor }}
                    >
                        メインアクション
                    </div>
                    <div
                        className="p-2 rounded-md text-center text-sm font-medium border"
                        style={{ borderColor: mainColor, color: mainColor }}
                    >
                        サブアクション
                    </div>
                </div>
            </div>
        </div>
    );
}