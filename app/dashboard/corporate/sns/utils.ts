// app/dashboard/corporate/sns/utils.ts
import { SNS_METADATA, type SnsPlatform } from '@/types/sns';

// URLを生成する関数
export const generateSnsUrl = (platform: string, username: string): string => {
  if (!platform || !username) return '';

  const metadata = SNS_METADATA[platform as SnsPlatform];
  if (metadata && metadata.baseUrl) {
    return `${metadata.baseUrl}${username}`;
  }

  return '';
};

// LINEのURLを正規化する関数
export const simplifyLineUrl = (url: string): string => {
  // 対象の文字列がない場合はそのまま返す
  if (!url) {
    return url;
  }

  // プロトコルがなければ追加（処理を統一するため）
  let processedUrl = url;
  if (processedUrl.startsWith('line.me/')) {
    processedUrl = 'https://' + processedUrl;
  }

  // https://line.me/ti/p/の部分を探す
  // 大文字小文字を区別しないように小文字に変換して検索
  const lowerUrl = processedUrl.toLowerCase();
  const baseUrl = 'https://line.me/ti/p/';

  // lin.ee短縮URLの処理
  if (lowerUrl.includes('lin.ee/')) {
    return processedUrl; // lin.eeのURLはそのまま返す
  }

  if (!lowerUrl.includes('line.me/ti/p/')) {
    return url; // LINE URLでない場合は元のURLを返す
  }

  const idStartPos = lowerUrl.lastIndexOf('line.me/ti/p/') + 'line.me/ti/p/'.length;

  // IDだけを抽出（URLパラメータは除去）
  let lineId = processedUrl.substring(idStartPos);
  lineId = lineId.split('?')[0].split('#')[0];

  // IDを使って新しいURLを構築
  return `${baseUrl}${lineId}`;
};

// APIエラー処理のヘルパー関数
export const handleApiError = (error: unknown, defaultMessage: string): string => {
  return error instanceof Error ? error.message : defaultMessage;
};