import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { readCompanyCsv } from './csv-reader';
import { extractEmailsFromSite, type EmailResult } from './email-extractor';
import type { PrintingCompany } from './types';

config({ path: path.resolve(process.cwd(), '.env.local') });

// 並列設定
const DEFAULT_CONCURRENCY = 10;
const PROGRESS_INTERVAL = 100;

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

function parseArgs(): { input?: string; limit?: number; concurrency: number } {
  const args = process.argv.slice(2);
  let input: string | undefined;
  let limit: number | undefined;
  let concurrency = DEFAULT_CONCURRENCY;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      input = args[i + 1];
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { input, limit, concurrency };
}

function escapeField(value: string | number | null): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

function exportCsvWithEmails(
  companies: PrintingCompany[],
  emailMap: Map<string, CompanyEmailResult>,
  outputPath: string
): void {
  const headers = [
    '会社名', '住所', '電話番号', 'WebサイトURL', 'Google評価',
    'レビュー数', '都道府県', 'place_id', 'メールアドレス', 'メール取得元URL',
  ];

  const rows = companies.map((c) => {
    const result = emailMap.get(c.placeId);
    return [
      c.name, c.address, c.phone, c.website, c.rating,
      c.reviewCount, c.prefecture, c.placeId,
      result?.emails.join('; ') || '',
      result?.sourceUrl || '',
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeField).join(','))
    .join('\n');

  const bom = '\uFEFF';
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, bom + csvContent, 'utf-8');
}

/** 並列バッチ処理 */
async function processBatch(
  companies: PrintingCompany[],
  concurrency: number,
  progressFile: string
): Promise<CompanyEmailResult[]> {
  const results: CompanyEmailResult[] = [];

  // チェックポイントから再開
  const processed = new Set<string>();
  if (fs.existsSync(progressFile)) {
    try {
      const saved: ScrapeProgress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
      results.push(...saved.results);
      saved.results.forEach((r) => processed.add(r.placeId));
      console.log(`チェックポイントから再開: ${processed.size}件処理済み`);
    } catch {
      // 破損したチェックポイントは無視
    }
  }

  const remaining = companies.filter((c) => !processed.has(c.placeId));
  const total = companies.length;
  let completed = processed.size;
  let emailFound = results.filter((r) => r.emails.length > 0).length;
  let errors = results.filter((r) => r.error && r.error !== 'Google Maps URL' && r.error !== 'メール未検出').length;

  console.log(`\n対象: ${remaining.length}件 (スキップ済み: ${processed.size}件)`);

  for (let i = 0; i < remaining.length; i += concurrency) {
    const batch = remaining.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(async (company): Promise<CompanyEmailResult> => {
        const result = await extractEmailsFromSite(company.website);
        return {
          placeId: company.placeId,
          emails: result.emails,
          sourceUrl: result.sourceUrl,
          error: result.error,
        };
      })
    );

    for (const settled of batchResults) {
      completed++;
      if (settled.status === 'fulfilled') {
        const result = settled.value;
        results.push(result);
        if (result.emails.length > 0) emailFound++;
        if (result.error && result.error !== 'Google Maps URL' && result.error !== 'メール未検出') errors++;
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
        `\r[${completed}/${total}] ${pct}% | メール発見: ${emailFound}件 | エラー: ${errors}件`
      );
    }

    // チェックポイント保存（500件ごと）
    if (completed % 500 === 0) {
      const progress: ScrapeProgress = {
        results,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(progressFile, JSON.stringify(progress), 'utf-8');
    }
  }

  // 最終チェックポイント保存
  const progress: ScrapeProgress = {
    results,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(progressFile, JSON.stringify(progress), 'utf-8');

  return results;
}

async function main() {
  const { input, limit, concurrency } = parseArgs();

  // 最新のCSVを自動検出
  const dataDir = path.join(process.cwd(), 'data');
  const defaultInput = input || (() => {
    const files = fs.readdirSync(dataDir)
      .filter((f) => f.startsWith('printing-companies-') && f.endsWith('.csv') && !f.includes('with-emails'))
      .sort()
      .reverse();
    if (files.length === 0) {
      throw new Error('data/ ディレクトリにCSVファイルが見つかりません');
    }
    return path.join(dataDir, files[0]);
  })();

  console.log(`入力CSV: ${defaultInput}`);
  const companies = readCompanyCsv(defaultInput);
  console.log(`読み込み: ${companies.length}件`);

  // Google Maps URLを集計
  const googleMapsCount = companies.filter(
    (c) => c.website.includes('maps.google.com') || c.website.includes('goo.gl/maps')
  ).length;
  console.log(`Google Maps URL: ${googleMapsCount}件（スキップ）`);

  // limit指定
  const targets = limit ? companies.slice(0, limit) : companies;
  if (limit) {
    console.log(`--limit ${limit}: 先頭${targets.length}件のみ処理`);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const progressFile = path.join(dataDir, 'email-scrape-progress.json');
  const outputPath = path.join(dataDir, `printing-companies-with-emails-${dateStr}.csv`);

  console.log(`並列数: ${concurrency}`);

  const results = await processBatch(targets, concurrency, progressFile);

  // 結果をマップに変換
  const emailMap = new Map<string, CompanyEmailResult>();
  for (const result of results) {
    emailMap.set(result.placeId, result);
  }

  // CSV出力
  exportCsvWithEmails(targets, emailMap, outputPath);

  // サマリー
  const withEmail = results.filter((r) => r.emails.length > 0).length;
  const totalEmails = results.reduce((sum, r) => sum + r.emails.length, 0);
  const errorCount = results.filter(
    (r) => r.error && r.error !== 'Google Maps URL' && r.error !== 'メール未検出'
  ).length;

  console.log('\n\n=== スクレイピング完了 ===');
  console.log(`対象URL数: ${targets.length} (Google Maps URL除外: ${googleMapsCount})`);
  console.log(`メール発見: ${withEmail}社 (${((withEmail / targets.length) * 100).toFixed(1)}%)`);
  console.log(`メールアドレス合計: ${totalEmails}件`);
  console.log(`エラー: ${errorCount}件`);
  console.log(`CSV出力: ${outputPath}`);
}

main().catch((err) => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
