// components/profile/ProfileSnsLink.tsx
"use client";

import { ImprovedSnsIcon } from "@/components/shared/ImprovedSnsIcon";
import type { SnsLink } from "@prisma/client";
import type { SnsPlatform } from "@/types/sns";
import { SNS_METADATA } from "@/types/sns";

interface ProfileSnsLinkProps {
    link: SnsLink;
    snsIconColor?: string; // mainColorを削除し、snsIconColorのみに
}

export function ProfileSnsLink({ link, snsIconColor }: ProfileSnsLinkProps) {
    const platform = link.platform as SnsPlatform;
    const name = SNS_METADATA[platform]?.name || platform;

    // ネイティブアプリ起動のために最適な形式でURLを生成
    const getOptimizedUrl = () => {
        // プラットフォーム固有の処理
        switch (platform) {
            case "line":
                // LINEアプリの起動を試みる
                if (link.username) {
                    return `line://ti/p/${link.username}`;
                }
                break;
            case "bereal":
                // LINEと同様にURLをそのまま使用
                // ユーザーがhttps://bere.al/usernameをコピーしてペーストした場合の処理
                if (link.url.startsWith('https://bere.al/')) {
                    return link.url;
                }
                break;
            case "instagram":
                // Instagramアプリの起動を試みる
                if (/instagram\.com\/([^\/]+)/.test(link.url)) {
                    const username = link.url.match(/instagram\.com\/([^\/]+)/)?.[1];
                    return `instagram://user?username=${username}`;
                }
                break;
            case "x":
                // Xアプリの起動を試みる
                if (/x\.com\/([^\/]+)/.test(link.url)) {
                    const username = link.url.match(/x\.com\/([^\/]+)/)?.[1];
                    return `twitter://user?screen_name=${username}`;
                }
                break;
            case "facebook":
                // Facebookアプリの起動を試みる
                return `fb://profile/${link.username}`;
            case "tiktok":
                // TikTokアプリの起動を試みる
                if (/tiktok\.com\/@([^\/]+)/.test(link.url)) {
                    const username = link.url.match(/tiktok\.com\/@([^\/]+)/)?.[1];
                    return `tiktok://user?username=${username}`;
                }
                break;
            case "youtube":
                // YouTubeアプリの起動を試みる
                if (/youtube\.com\/channel\/([^\/]+)/.test(link.url)) {
                    const channelId = link.url.match(/youtube\.com\/channel\/([^\/]+)/)?.[1];
                    return `vnd.youtube://channel/${channelId}`;
                }
                break;
        }

        // デフォルトはブラウザで開く
        return link.url;
    };

    const handleClick = (e: React.MouseEvent) => {
        const optimizedUrl = getOptimizedUrl();

        // 特殊なURLスキームを持つ場合、まずネイティブアプリの起動を試みる
        if (optimizedUrl !== link.url) {
            try {
                window.location.href = optimizedUrl;

                // フォールバック: 一定時間後にブラウザで開く
                setTimeout(() => {
                    window.open(link.url, "_blank");
                }, 500);

                e.preventDefault();
            } catch (error) {
                // エラーが発生した場合はブラウザで開く
                console.error("Failed to open app:", error);
            }
        }
    };

    // snsIconColorに基づいてアイコンの色を設定
    const iconColor = snsIconColor === "original" ? "original" : (snsIconColor || "#333333");

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex flex-col items-center"
        >
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1 shadow-md"
                style={{ backgroundColor: "white" }}
            >
                <ImprovedSnsIcon
                    platform={platform}
                    size={38}
                    color={iconColor}
                />
            </div>
            <span className="text-xs text-gray-600 mt-1">{name}</span>
        </a>
    );
}