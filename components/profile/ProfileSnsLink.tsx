// components/profile/ProfileSnsLink.tsx
"use client";

import { ImprovedSnsIcon } from "@/components/shared/ImprovedSnsIcon";
import type { SnsLink } from "@prisma/client";
import type { SnsPlatform } from "@/types/sns";
import { SNS_METADATA } from "@/types/sns";

interface ProfileSnsLinkProps {
    link: SnsLink;
    snsIconColor?: string;
}

export function ProfileSnsLink({ link, snsIconColor }: ProfileSnsLinkProps) {
    // プラットフォーム名の標準化（大文字小文字の違いを吸収）
    const normalizeSnsPlatform = (platform: string): SnsPlatform => {
        const platformLower = platform.toLowerCase();

        if (platformLower === 'line') return 'line';
        if (platformLower === '公式line') return 'official-line';
        if (platformLower === 'youtube') return 'youtube';
        if (platformLower === 'x') return 'x';
        if (platformLower === 'instagram') return 'instagram';
        if (platformLower === 'tiktok') return 'tiktok';
        if (platformLower === 'facebook') return 'facebook';
        if (platformLower === 'pinterest') return 'pinterest';
        if (platformLower === 'threads') return 'threads';
        if (platformLower === 'note') return 'note';
        if (platformLower === 'bereal') return 'bereal';

        // デフォルト値
        return 'line' as SnsPlatform;
    };

    // プラットフォーム名を標準化
    const normalizedPlatform = normalizeSnsPlatform(link.platform);
    const name = SNS_METADATA[normalizedPlatform]?.name || link.platform;

    // ネイティブアプリ起動のために最適な形式でURLを生成
    const getOptimizedUrl = () => {
        // 元のURL（これがなければ表示しない）
        if (!link.url) return '#';
        
        // プラットフォーム固有の処理
        switch (normalizedPlatform) {
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

    // クリックイベントハンドラを追加（ネイティブアプリ起動用）
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
    const iconColor = snsIconColor === 'original' 
        ? 'original' 
        : (snsIconColor || '#333333');

    // URLが存在する場合は常にアイコンを表示する
    return (
        <a
            href={link.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick} // ここでhandleClickを使用
            className="flex flex-col items-center"
        >
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1 shadow-md"
                style={{ backgroundColor: "white" }}
            >
                <ImprovedSnsIcon
                    platform={normalizedPlatform}
                    size={38}
                    color={iconColor}
                />
            </div>
            <span className="text-xs text-gray-600 mt-1">{name}</span>
        </a>
    );
}