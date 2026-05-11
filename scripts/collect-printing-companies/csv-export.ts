import * as fs from 'fs';
import * as path from 'path';
import type { PrintingCompany } from './types';

const CSV_HEADERS = [
  '会社名',
  '住所',
  '電話番号',
  'WebサイトURL',
  'Google評価',
  'レビュー数',
  '都道府県',
  'place_id',
];

function escapeField(value: string | number | null): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportToCsv(companies: PrintingCompany[], outputPath?: string): string {
  const rows = companies.map((c) => [
    c.name,
    c.address,
    c.phone,
    c.website,
    c.rating,
    c.reviewCount,
    c.prefecture,
    c.placeId,
  ]);

  const csvContent = [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeField).join(','))
    .join('\n');

  // BOM付きUTF-8（Excel互換）
  const bom = '\uFEFF';
  const csvWithBom = bom + csvContent;

  const dateStr = new Date().toISOString().split('T')[0];
  const filePath = outputPath || path.join(process.cwd(), 'data', `printing-companies-${dateStr}.csv`);

  // 出力ディレクトリがなければ作成
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, csvWithBom, 'utf-8');
  return filePath;
}
