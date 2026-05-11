/**
 * Playwright版メールアドレス再取得スクリプト
 *
 * 既存のHTTP fetch版で取得できなかった印刷会社のメールアドレスを
 * ヘッドレスブラウザ（Playwright）で再取得する。
 *
 * 改善点:
 * - JavaScriptレンダリング後のDOMからメール抽出
 * - サブページの探索パスを大幅に拡充
 * - フッター・サイドバー等に埋め込まれたメールも取得
 *
 * 使い方:
 *   npx tsx scripts/collect-printing-companies/collect-emails-playwright.ts [--limit N] [--concurrency N]
 */

import * as fs from 'fs';
import * as path from 'path';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { readCompanyCsv } from './csv-reader';
import type { PrintingCompany } from './types';

// ── 設定 ──
const PAGE_TIMEOUT = 15_000;
const DEFAULT_CONCURRENCY = 5; // ブラウザなので控えめに
const PROGRESS_INTERVAL = 50;
const CHECKPOINT_INTERVAL = 200;

// ── メール抽出パターン ──
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const EXCLUDE_DOMAINS = [
  'example.com', 'example.co.jp', 'sentry.io', 'wixpress.com',
  'googleapis.com', 'googleusercontent.com', 'gstatic.com',
  'w3.org', 'schema.org', 'ogp.me', 'facebook.com', 'twitter.com',
  'instagram.com', 'youtube.com', 'line.me', 'apple.com',
  'microsoft.com', 'amazon.com', 'cloudflare.com',
];
const EXCLUDE_PREFIXES = ['noreply@', 'no-reply@', 'mailer-daemon@', 'postmaster@', 'webmaster@'];
const EXCLUDE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf'];

// ── サブページ探索パス（大幅拡充） ──
const CONTACT_PATHS = [
  // 英語系
  '/contact', '/contact/', '/contact.html', '/contact.php', '/contact.htm',
  '/inquiry', '/inquiry/', '/inquiry.html',
  '/about', '/about/', '/about.html', '/about-us',
  '/company', '/company/', '/company.html', '/company-info',
  '/access', '/access/', '/access.html',
  '/info', '/info/',
  // 日本語系
  '/お問い合わせ', '/お問い合せ', '/お問合せ', '/お問合わせ',
  '/会社概要', '/会社案内', '/会社情報',
  '/アクセス',
  // よくあるCMSパス
  '/contactus', '/enquiry', '/form', '/mail',
  '/toiawase', '/otoiawase',
  '/gaiyou', '/gaiyo',
  '/corporate', '/profile',
  // WordPress系
  '/contact-us', '/?page_id=2',
  // サブディレクトリ系
  '/corp/', '/corp/company.html',
  '/contents/contact', '/contents/company',
  '/guide/access',
];

// ── 型定義 ──
interface CompanyEmailResult {
  placeId: string;
  emails: string[];
  sourceUrl: string;
  error?: string;
}

interface ScrapeProgress {
  results: CompanyEmailResult[];
  startedAt: string;
  updatedAt: string;
}

// ── メール検証 ──
function isValidEmail(email: string): boolean {
  if (EXCLUDE_EXTENSIONS.some((ext) => email.endsWith(ext))) return false;
  const domain = email.split('@')[1];
  if (!domain) return false;
  if (EXCLUDE_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) return false;
  if (EXCLUDE_PREFIXES.some((p) => email.startsWith(p))) return false;
  if (domain.length < 4) return false;
  if (!domain.includes('.')) return false;
  // 数字だけのローカルパートは除外（誤検出が多い）
  const local = email.split('@')[0];
  if (/^\d+$/.test(local)) return false;
  return true;
}

// ── ページからメール抽出（JS実行後のDOM） ──
async function extractEmailsFromPage(page: Page): Promise<string[]> {
  const emails = new Set<string>();

  try {
    // 1. ページ全体のテキストコンテンツから抽出
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    const textMatches = bodyText.match(EMAIL_REGEX) || [];
    for (const m of textMatches) {
      const e = m.toLowerCase();
      if (isValidEmail(e)) emails.add(e);
    }

    // 2. mailto: リンクから抽出
    const mailtoEmails = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="mailto:"]');
      return Array.from(links).map((a) => {
        const href = a.getAttribute('href') || '';
        return href.replace(/^mailto:/i, '').split('?')[0].trim();
      });
    });
    for (const e of mailtoEmails) {
      const lower = decodeURIComponent(e).toLowerCase();
      if (isValidEmail(lower)) emails.add(lower);
    }

    // 3. HTML属性（data-*, title, alt等）からも抽出
    const attrEmails = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const found: string[] = [];
      for (const el of allElements) {
        for (const attr of el.attributes) {
          const matches = attr.value.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
          if (matches) found.push(...matches);
        }
      }
      return found;
    });
    for (const e of attrEmails) {
      const lower = e.toLowerCase();
      if (isValidEmail(lower)) emails.add(lower);
    }
  } catch {
    // ページ評価エラーは無視
  }

  return Array.from(emails);
}

// ── 1サイトからメール収集 ──
async function extractEmailsFromSite(
  context: BrowserContext,
  websiteUrl: string
): Promise<{ emails: string[]; sourceUrl: string; error?: string }> {
  // Google Maps URL はスキップ
  if (websiteUrl.includes('maps.google.com') || websiteUrl.includes('goo.gl/maps')) {
    return { emails: [], sourceUrl: '', error: 'Google Maps URL' };
  }

  let baseUrl: string;
  try {
    const parsed = new URL(websiteUrl);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    return { emails: [], sourceUrl: '', error: 'URL解析エラー' };
  }

  const page = await context.newPage();

  try {
    // トップページ
    try {
      await page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
      // JS実行を少し待つ
      await page.waitForTimeout(1500);

      const emails = await extractEmailsFromPage(page);
      if (emails.length > 0) {
        return { emails, sourceUrl: websiteUrl };
      }

      // トップページのリンクからcontact系ページを発見
      const discoveredPaths = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href]');
        const paths: string[] = [];
        const keywords = [
          'contact', 'inquiry', 'mail', 'toiawase', 'otoiawase',
          'お問い合わせ', 'お問い合せ', 'お問合せ', '問い合わせ', '問合せ',
          '会社概要', '会社案内', 'company', 'about', 'access',
        ];
        for (const link of links) {
          const href = link.getAttribute('href') || '';
          const text = link.textContent || '';
          const lowerHref = href.toLowerCase();
          const lowerText = text.toLowerCase();
          if (keywords.some((kw) => lowerHref.includes(kw) || lowerText.includes(kw))) {
            paths.push(href);
          }
        }
        return paths;
      });

      // 発見したパスを固定パスリストに追加
      const allPaths = [...new Set([...discoveredPaths, ...CONTACT_PATHS])];

      // サブページを順に試行
      for (const subPath of allPaths) {
        try {
          let subUrl: string;
          if (subPath.startsWith('http://') || subPath.startsWith('https://')) {
            // 同一ドメインのみ
            const subParsed = new URL(subPath);
            if (subParsed.host !== new URL(baseUrl).host) continue;
            subUrl = subPath;
          } else if (subPath.startsWith('/') || subPath.startsWith('?')) {
            subUrl = new URL(subPath, baseUrl).href;
          } else {
            subUrl = new URL(subPath, websiteUrl).href;
          }

          await page.goto(subUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
          await page.waitForTimeout(1000);

          const emails = await extractEmailsFromPage(page);
          if (emails.length > 0) {
            return { emails, sourceUrl: subUrl };
          }
        } catch {
          // ナビゲーションエラーは無視して次のパスへ
        }
      }
    } catch {
      return { emails: [], sourceUrl: '', error: 'ページ取得失敗' };
    }

    return { emails: [], sourceUrl: '', error: 'メール未検出' };
  } finally {
    await page.close().catch(() => {});
  }
}

// ── メイン処理 ──
async function main() {
  // 引数パース
  const args = process.argv.slice(2);
  let limit: number | undefined;
  let concurrency = DEFAULT_CONCURRENCY;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[i + 1], 10);
      i++;
    }
  }

  // 既存のメール付きCSVを読み込み、メール未取得の会社だけ抽出
  const dataDir = path.join(process.cwd(), 'data');
  const emailCsvPath = path.join(dataDir, 'printing-companies-with-emails-2026-03-23.csv');

  if (!fs.existsSync(emailCsvPath)) {
    console.error('メール付きCSVが見つかりません:', emailCsvPath);
    process.exit(1);
  }

  // 元データ読み込み
  const allCompanies = readCompanyCsv(emailCsvPath);
  console.log(`全件数: ${allCompanies.length}`);

  // メール未取得の会社のみ抽出（website URLがあるもの）
  const noEmailCompanies = allCompanies.filter((c) => {
    if (!c.website || c.website.includes('maps.google.com') || c.website.includes('goo.gl/maps')) {
      return false;
    }
    return true;
  });

  // 既存のメール付きデータをチェック
  const existingEmails = new Map<string, { emails: string; sourceUrl: string }>();
  const rawContent = fs.readFileSync(emailCsvPath, 'utf-8');
  const rawLines = rawContent.split('\n').filter((l) => l.trim());
  for (let i = 1; i < rawLines.length; i++) {
    const fields = parseRawCsvRow(rawLines[i]);
    const placeId = fields[7] || '';
    const email = fields[8] || '';
    const sourceUrl = fields[9] || '';
    if (email) {
      existingEmails.set(placeId, { emails: email, sourceUrl });
    }
  }

  const targets = noEmailCompanies.filter((c) => !existingEmails.has(c.placeId));
  console.log(`メール未取得（対象）: ${targets.length}件`);

  const finalTargets = limit ? targets.slice(0, limit) : targets;
  if (limit) {
    console.log(`--limit ${limit}: 先頭${finalTargets.length}件のみ処理`);
  }

  // チェックポイント
  const progressFile = path.join(dataDir, 'email-scrape-playwright-progress.json');
  const results: CompanyEmailResult[] = [];
  const processed = new Set<string>();

  if (fs.existsSync(progressFile)) {
    try {
      const saved: ScrapeProgress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
      results.push(...saved.results);
      saved.results.forEach((r) => processed.add(r.placeId));
      console.log(`チェックポイントから再開: ${processed.size}件処理済み`);
    } catch {
      // 破損は無視
    }
  }

  const remaining = finalTargets.filter((c) => !processed.has(c.placeId));
  console.log(`残り: ${remaining.length}件`);
  console.log(`並列数: ${concurrency}`);

  // Playwright起動
  const browser = await chromium.launch({ headless: true });
  let completed = processed.size;
  let emailFound = results.filter((r) => r.emails.length > 0).length;
  let errors = 0;
  const total = finalTargets.length;

  console.log('\nスクレイピング開始...\n');

  try {
    for (let i = 0; i < remaining.length; i += concurrency) {
      const batch = remaining.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map(async (company): Promise<CompanyEmailResult> => {
          const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'ja-JP',
            ignoreHTTPSErrors: true,
          });

          try {
            const result = await extractEmailsFromSite(context, company.website);
            return {
              placeId: company.placeId,
              emails: result.emails,
              sourceUrl: result.sourceUrl,
              error: result.error,
            };
          } finally {
            await context.close().catch(() => {});
          }
        })
      );

      for (const settled of batchResults) {
        completed++;
        if (settled.status === 'fulfilled') {
          results.push(settled.value);
          if (settled.value.emails.length > 0) emailFound++;
          if (settled.value.error && !['Google Maps URL', 'メール未検出'].includes(settled.value.error)) errors++;
        } else {
          errors++;
          results.push({
            placeId: 'unknown',
            emails: [],
            sourceUrl: '',
            error: settled.reason?.message || 'Unknown error',
          });
        }
      }

      // 進捗表示
      if (completed % PROGRESS_INTERVAL === 0 || i + concurrency >= remaining.length) {
        const pct = ((completed / total) * 100).toFixed(1);
        process.stdout.write(
          `\r[${completed}/${total}] ${pct}% | 新規メール発見: ${emailFound}件 | エラー: ${errors}件`
        );
      }

      // チェックポイント保存
      if (completed % CHECKPOINT_INTERVAL === 0) {
        saveCheckpoint(progressFile, results);
      }
    }
  } finally {
    await browser.close();
  }

  // 最終チェックポイント保存
  saveCheckpoint(progressFile, results);

  // 結果をマージしてCSV出力
  const newEmailMap = new Map<string, CompanyEmailResult>();
  for (const r of results) {
    if (r.emails.length > 0) {
      newEmailMap.set(r.placeId, r);
    }
  }

  // 既存CSVを更新（メール未取得だった行にマージ）
  const outputPath = path.join(dataDir, `printing-companies-with-emails-${new Date().toISOString().split('T')[0]}.csv`);
  mergeAndExport(emailCsvPath, newEmailMap, outputPath);

  // サマリー
  console.log('\n\n=== Playwright版スクレイピング完了 ===');
  console.log(`対象: ${finalTargets.length}件（メール未取得分）`);
  console.log(`新規メール発見: ${emailFound}件`);
  console.log(`エラー: ${errors}件`);
  console.log(`出力CSV: ${outputPath}`);
}

function saveCheckpoint(filePath: string, results: CompanyEmailResult[]) {
  const progress: ScrapeProgress = {
    results,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, JSON.stringify(progress), 'utf-8');
}

function parseRawCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

function escapeField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function mergeAndExport(
  originalCsvPath: string,
  newEmails: Map<string, CompanyEmailResult>,
  outputPath: string
) {
  let content = fs.readFileSync(originalCsvPath, 'utf-8');
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  const lines = content.split('\n').filter((l) => l.trim());
  const header = lines[0];
  const outputLines = [header];

  let mergedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseRawCsvRow(lines[i]);
    const placeId = fields[7] || '';
    const existingEmail = fields[8] || '';

    if (!existingEmail && newEmails.has(placeId)) {
      const result = newEmails.get(placeId)!;
      fields[8] = result.emails.join('; ');
      fields[9] = result.sourceUrl;
      mergedCount++;
    }

    // フィールド数を確保
    while (fields.length < 10) fields.push('');

    outputLines.push(fields.map(escapeField).join(','));
  }

  const bom = '\uFEFF';
  fs.writeFileSync(outputPath, bom + outputLines.join('\n'), 'utf-8');
  console.log(`\nマージ件数: ${mergedCount}件を既存CSVに追加`);
}

main().catch((err) => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
