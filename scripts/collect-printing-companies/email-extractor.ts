// メールアドレス抽出ロジック

const FETCH_TIMEOUT = 10_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const MAILTO_REGEX = /href=["']mailto:([^"'?]+)/gi;

// 除外パターン
const EXCLUDE_DOMAINS = [
  'example.com',
  'example.co.jp',
  'sentry.io',
  'wixpress.com',
  'googleapis.com',
  'googleusercontent.com',
  'gstatic.com',
  'w3.org',
  'schema.org',
  'ogp.me',
  'facebook.com',
  'twitter.com',
];
const EXCLUDE_PREFIXES = ['noreply@', 'no-reply@', 'mailer-daemon@'];
const EXCLUDE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.css', '.js'];

// サブページの固定パスリスト
const CONTACT_PATHS = ['/contact', '/inquiry', '/about', '/company', '/お問い合わせ', '/会社概要'];

/** HTMLをフェッチ（エンコーディング自動検出対応） */
export async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'ja,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }

    // バイナリとして取得してエンコーディング検出
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Content-Type ヘッダーからcharset検出
    let charset = detectCharsetFromHeader(contentType);

    // HTMLのmetaタグからcharset検出
    if (!charset) {
      const previewText = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 2048));
      charset = detectCharsetFromHtml(previewText);
    }

    // デコード
    const decoder = new TextDecoder(charset || 'utf-8', { fatal: false });
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

/** Content-Typeヘッダーからcharset抽出 */
function detectCharsetFromHeader(contentType: string): string | null {
  const match = contentType.match(/charset=([^\s;]+)/i);
  if (!match) return null;
  return normalizeCharset(match[1]);
}

/** HTMLのmetaタグからcharset抽出 */
function detectCharsetFromHtml(html: string): string | null {
  // <meta charset="...">
  const metaCharset = html.match(/<meta[^>]+charset=["']?([^"'\s;>]+)/i);
  if (metaCharset) return normalizeCharset(metaCharset[1]);

  // <meta http-equiv="Content-Type" content="...; charset=...">
  const httpEquiv = html.match(
    /<meta[^>]+http-equiv=["']?Content-Type["']?[^>]+content=["'][^"']*charset=([^"'\s;]+)/i
  );
  if (httpEquiv) return normalizeCharset(httpEquiv[1]);

  return null;
}

/** charset名を正規化 */
function normalizeCharset(charset: string): string {
  const lower = charset.toLowerCase().replace(/['"]/g, '');
  if (lower === 'shift_jis' || lower === 'shift-jis' || lower === 'sjis' || lower === 'x-sjis') {
    return 'shift_jis';
  }
  if (lower === 'euc-jp' || lower === 'eucjp' || lower === 'x-euc-jp') {
    return 'euc-jp';
  }
  if (lower === 'iso-2022-jp') {
    return 'iso-2022-jp';
  }
  return lower;
}

/** HTMLからメールアドレスを抽出 */
export function extractEmails(html: string): string[] {
  const emails = new Set<string>();

  // mailto: リンクから抽出
  let match: RegExpExecArray | null;
  const mailtoRegex = new RegExp(MAILTO_REGEX.source, 'gi');
  while ((match = mailtoRegex.exec(html)) !== null) {
    const email = decodeURIComponent(match[1]).trim().toLowerCase();
    if (isValidEmail(email)) {
      emails.add(email);
    }
  }

  // HTML全体から正規表現で抽出
  const emailRegex = new RegExp(EMAIL_REGEX.source, 'g');
  while ((match = emailRegex.exec(html)) !== null) {
    const email = match[0].toLowerCase();
    if (isValidEmail(email)) {
      emails.add(email);
    }
  }

  return Array.from(emails);
}

/** メールアドレスの妥当性チェック（除外フィルタ） */
function isValidEmail(email: string): boolean {
  // 画像ファイル名の誤検出
  if (EXCLUDE_EXTENSIONS.some((ext) => email.endsWith(ext))) return false;

  // 除外ドメイン
  const domain = email.split('@')[1];
  if (!domain) return false;
  if (EXCLUDE_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) return false;

  // 除外プレフィックス
  if (EXCLUDE_PREFIXES.some((p) => email.startsWith(p))) return false;

  // 明らかに短すぎるドメイン
  if (domain.length < 4) return false;

  // TLDがない
  if (!domain.includes('.')) return false;

  return true;
}

/** robots.txt をチェック（クロール許可されているか） */
async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return true; // robots.txt がなければ許可

    const text = await res.text();
    // 簡易パーサー: User-agent: * の Disallow: / をチェック
    const lines = text.split('\n');
    let inAllAgents = false;
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith('user-agent:')) {
        inAllAgents = trimmed.includes('*');
      } else if (inAllAgents && trimmed === 'disallow: /') {
        return false; // 全ページクロール禁止
      }
    }
    return true;
  } catch {
    return true; // エラー時は許可とみなす
  }
}

/** URLからベースURL（ドメインルート）を算出 */
function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

export interface EmailResult {
  emails: string[];
  sourceUrl: string;
  error?: string;
}

/** 1サイトからメールアドレスを収集 */
export async function extractEmailsFromSite(websiteUrl: string): Promise<EmailResult> {
  // Google Maps URL はスキップ
  if (websiteUrl.includes('maps.google.com') || websiteUrl.includes('goo.gl/maps')) {
    return { emails: [], sourceUrl: '', error: 'Google Maps URL' };
  }

  const baseUrl = getBaseUrl(websiteUrl);

  // robots.txt チェック
  const allowed = await checkRobotsTxt(baseUrl);
  if (!allowed) {
    return { emails: [], sourceUrl: '', error: 'robots.txt で禁止' };
  }

  // トップページを取得
  const topHtml = await fetchPage(websiteUrl);
  if (topHtml) {
    const emails = extractEmails(topHtml);
    if (emails.length > 0) {
      return { emails, sourceUrl: websiteUrl };
    }
  }

  // サブページを順に試行
  for (const subPath of CONTACT_PATHS) {
    try {
      const subUrl = new URL(subPath, baseUrl).href;
      const html = await fetchPage(subUrl);
      if (html) {
        const emails = extractEmails(html);
        if (emails.length > 0) {
          return { emails, sourceUrl: subUrl };
        }
      }
    } catch {
      // URLパースエラーは無視
    }
  }

  return { emails: [], sourceUrl: '', error: topHtml === null ? 'ページ取得失敗' : 'メール未検出' };
}
