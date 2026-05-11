import * as path from 'path';
import { config } from 'dotenv';
import { PREFECTURES, HOKKAIDO_EXTRA_POINTS } from './prefectures';
import { collectPrintingCompanies } from './google-places';
import { exportToCsv } from './csv-export';

// .env.local を読み込み（Next.js外での実行用）
config({ path: path.resolve(process.cwd(), '.env.local') });

function parseArgs(): { prefecture?: string } {
  const args = process.argv.slice(2);
  const prefIndex = args.indexOf('--prefecture');
  if (prefIndex !== -1 && args[prefIndex + 1]) {
    return { prefecture: args[prefIndex + 1] };
  }
  return {};
}

async function main() {
  const { prefecture } = parseArgs();

  // 北海道の追加検索ポイントを結合
  let allPrefectures = [...PREFECTURES, ...HOKKAIDO_EXTRA_POINTS];

  // 特定都道府県のみ指定された場合
  if (prefecture) {
    allPrefectures = allPrefectures.filter(
      (p) => p.nameEn === prefecture || p.nameEn.startsWith(`${prefecture}-`)
    );
    if (allPrefectures.length === 0) {
      console.error(`都道府県 "${prefecture}" が見つかりません。nameEn で指定してください。`);
      console.error('例: --prefecture tokyo, --prefecture hokkaido');
      process.exit(1);
    }
    console.log(`対象: ${allPrefectures.map((p) => p.name).join(', ')}`);
  } else {
    console.log(`全国 ${allPrefectures.length} 地点を検索します`);
  }

  const allCompanies = await collectPrintingCompanies(allPrefectures);

  // === 除外フィルタ ===

  // 1. はんこ屋・印鑑店を除外（ただし「印刷」も含む場合は残す）
  const EXCLUDE_NAME_KEYWORDS = ['はんこ', '印鑑', 'ゴム印', 'スタンプ'];
  let companies = allCompanies.filter((c) => {
    const hasExcluded = EXCLUDE_NAME_KEYWORDS.some((kw) => c.name.includes(kw));
    return !(hasExcluded && !c.name.includes('印刷'));
  });
  const nameExcluded = allCompanies.length - companies.length;

  // 2. 非印刷業種の会社名を除外（カメラ店等）
  const EXCLUDE_NAME_PATTERNS = ['カメラ'];
  const beforeNamePattern = companies.length;
  companies = companies.filter((c) => {
    return !EXCLUDE_NAME_PATTERNS.some((kw) => c.name.includes(kw));
  });
  const namePatternExcluded = beforeNamePattern - companies.length;

  // 3. 非印刷チェーンをドメインで除外（写真プリント・家電量販店・SNS等）
  const EXCLUDE_DOMAINS = [
    // 写真プリントチェーン
    'kitamura.jp', '80210.com', 'studio-alice.co.jp', 'studio-mario.jp',
    'cameranonaniwa.co.jp', 'fujifilm.com',
    // 量販店・小売
    'daiso-sangyo.co.jp', 'yodobashi.com', 'ksdenki.com',
    'store.supersports.com', 'store-tsutaya.tsite.jp',
    // イオン
    'aeon.com', 'aeontohoku.co.jp', 'aeon-hokkaido.jp', 'aeon-kyushu.info',
    // はんこチェーン
    'han-roku.co.jp',
    // 地図（ゼンリン ※ゼンリンプリンテックスは会社名で残す）
    'zenrin.co.jp',
    // SNS・プラットフォーム
    'instagram.com', 'facebook.com', 'twitter.com',
    'r.goope.jp', 'sites.google.com', 'peraichi.com', 'big-advance.site',
  ];
  const beforeDomain = companies.length;
  companies = companies.filter((c) => {
    // ゼンリンプリンテックスは残す
    if (c.name.includes('ゼンリンプリンテックス')) return true;
    return !EXCLUDE_DOMAINS.some((d) => c.website.includes(d));
  });
  const domainExcluded = beforeDomain - companies.length;

  // 4. 同一URLの重複を除去（最初の1件のみ残す、Google Maps URLは除く）
  const seenUrls = new Set<string>();
  const beforeDedup = companies.length;
  companies = companies.filter((c) => {
    if (c.website.includes('maps.google.com')) return true;
    if (seenUrls.has(c.website)) return false;
    seenUrls.add(c.website);
    return true;
  });
  const dedupExcluded = beforeDedup - companies.length;

  const totalExcluded = nameExcluded + namePatternExcluded + domainExcluded + dedupExcluded;
  if (totalExcluded > 0) {
    console.log(`\n除外合計: ${totalExcluded}件`);
    console.log(`  はんこ等: ${nameExcluded}件、カメラ店: ${namePatternExcluded}件、非印刷ドメイン: ${domainExcluded}件、URL重複: ${dedupExcluded}件`);
  }

  if (companies.length === 0) {
    console.log('収集結果が0件でした。APIキーやPlaces APIの有効化を確認してください。');
    process.exit(0);
  }

  const outputPath = exportToCsv(companies);
  console.log(`\nCSV出力完了: ${outputPath}`);
  console.log(`合計 ${companies.length} 件`);
}

main().catch((err) => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
