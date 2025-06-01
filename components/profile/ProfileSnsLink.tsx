// components/profile/ProfileSnsLink.tsx (Android対応版)
'use client';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import type { SnsLink } from '@prisma/client';
import type { SnsPlatform } from '@/types/sns';
import { SNS_METADATA } from '@/types/sns';
interface ProfileSnsLinkProps {
  link: SnsLink;
  snsIconColor?: string;
}
export function ProfileSnsLink({ link, snsIconColor }: ProfileSnsLinkProps) {
  // プラットフォーム名の標準化（大文字小文字の違いを吸収）
  const normalizeSnsPlatform = (platform: string): SnsPlatform => {
    const platformLower = platform.toLowerCase();
    if (platformLower === 'line') return 'line';
    if (platformLower === '公式line' || platformLower === 'official-line') return 'official-line';
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
  // プラットフォームを標準化
  const normalizedPlatform = normalizeSnsPlatform(link.platform);
  // 正しい表示名を取得（SNS_METADATAから取得することが重要）
  const displayName = SNS_METADATA[normalizedPlatform]?.name || link.platform;
  // ネイティブアプリ起動のために最適な形式でURLを生成
  const getOptimizedUrl = () => {
    // 元のURL（これがなければ表示しない）
    if (!link.url) return '#';
    // プラットフォーム固有の処理
    switch (normalizedPlatform) {
      case 'line':
        // LINEアプリの起動を試みる
        if (link.username) {
          return `line://ti/p/${link.username}`;
        }
        break;
      case 'official-line':
        // 公式LINEはURLをそのまま使用
        return link.url;
      case 'bereal':
        // BeRealの処理
        if (link.url.startsWith('https://bere.al/')) {
          return link.url;
        }
        break;
      case 'instagram':
        // Instagramの処理
        if (/instagram\.com\/([^\/]+)/.test(link.url)) {
          const username = link.url.match(/instagram\.com\/([^\/]+)/)?.[1];
          return `instagram://user?username=${username}`;
        }
        break;
      case 'x':
        // Xの処理
        if (/x\.com\/([^\/]+)/.test(link.url)) {
          const username = link.url.match(/x\.com\/([^\/]+)/)?.[1];
          return `twitter://user?screen_name=${username}`;
        }
        break;
      case 'facebook':
        // Facebookの処理
        return `fb://profile/${link.username}`;
      case 'tiktok':
        // TikTokの処理
        if (/tiktok\.com\/@([^\/]+)/.test(link.url)) {
          const username = link.url.match(/tiktok\.com\/@([^\/]+)/)?.[1];
          return `tiktok://user?username=${username}`;
        }
        break;
      case 'youtube':
        // YouTubeの処理
        if (/youtube\.com\/channel\/([^\/]+)/.test(link.url)) {
          const channelId = link.url.match(/youtube\.com\/channel\/([^\/]+)/)?.[1];
          return `vnd.youtube://channel/${channelId}`;
        }
        break;
      case 'threads':
      case 'pinterest':
      case 'note':
      default:
        // その他のプラットフォームはURLをそのまま使用
        return link.url;
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
          window.open(link.url, '_blank');
        }, 500);
        e.preventDefault();
      } catch {
        // エラーが発生した場合はブラウザで開く
      }
    }
  };
  // snsIconColorに基づいてアイコンの色を設定
  const iconColor = snsIconColor === 'original' ? 'original' : snsIconColor || '#333333';
  // 🔥 Android対応: Tailwindクラスをインラインスタイルに変更
  return (
    <a
      href={link.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '80px',
        margin: '0 auto',
        textDecoration: 'none',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '64px', // w-16 = 4rem = 64px
          height: '64px', // h-16 = 4rem = 64px
          borderRadius: '16px', // rounded-2xl = 1rem = 16px
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px', // mb-1 = 0.25rem = 4px
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-md
          boxSizing: 'border-box',
        }}
      >
        <ImprovedSnsIcon platform={normalizedPlatform} size={38} color={iconColor} />
      </div>
      <span
        style={{
          fontSize: '0.75rem', // text-xs相当（固定値から相対値に変更）
          color: '#4B5563', // text-gray-600
          marginTop: '4px', // mt-1 = 0.25rem = 4px
          textAlign: 'center',
          lineHeight: '1.2',
          maxWidth: '100%',
          wordBreak: 'break-word',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
        className="profile-text" // 拡大ツール対応のクラスを追加
      >
        {displayName}
      </span>
    </a>
  );
}