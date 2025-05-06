// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names with Tailwind CSS classes using clsx and twMerge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generates a random string to be used as a slug
 */
export function generateSlug(length: number = 8): string {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

/**
 * Formats a date to a localized string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Returns initials from a name
 */
export function getInitials(name: string): string {
    if (!name) return "";

    const names = name.split(" ");

    if (names.length === 1) {
        return names[0].substring(0, 2).toUpperCase();
    }

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

// User type for generateVCard function
interface UserForVCard {
    name?: string | null;
    nameEn?: string | null;
    phone?: string | null;
    email?: string | null;
    company?: string | null;
    image?: string | null;
}

/**
 * Generates a vCard (.vcf) file for contact information
 */
export function generateVCard(user: UserForVCard) {
    // vCard format (version 3.0)
    const vCardLines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${user.name || ''}`,
        `N:${user.nameEn?.split(' ').pop() || ''};${user.nameEn?.split(' ')[0] || ''};;;`,
    ];

    // Add optional fields if they exist
    if (user.phone) {
        vCardLines.push(`TEL;TYPE=CELL:${user.phone}`);
    }

    if (user.email) {
        vCardLines.push(`EMAIL:${user.email}`);
    }

    if (user.company) {
        vCardLines.push(`ORG:${user.company}`);
    }

    // Add profile image if exists
    if (user.image) {
        vCardLines.push(`PHOTO;VALUE=uri:${user.image}`);
    }

    // End vCard
    vCardLines.push('END:VCARD');

    return vCardLines.join('\n');
}

// 日付フォーマット用の関数
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // 経過時間を計算
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // 相対時間を返す
  if (diffDay > 30) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  } else if (diffDay > 0) {
    return `${diffDay}日前`;
  } else if (diffHour > 0) {
    return `${diffHour}時間前`;
  } else if (diffMin > 0) {
    return `${diffMin}分前`;
  } else {
    return `${diffSec}秒前`;
  }
}

/**
 * プラン名を日本語に変換する
 */
export function getPlanNameInJapanese(planName: string): string {
  switch (planName) {
    case 'monthly':
      return '月額プラン';
    case 'yearly':
      return '年額プラン';
    case 'business':
      return 'スタータープラン';
    case 'business_plus':
    case 'business-plus':
      return 'ビジネスプラン';
    case 'enterprise':
      return 'エンタープライズプラン';
    default:
      return planName || '不明なプラン';
  }
}