import * as fs from 'fs';
import type { PrintingCompany } from './types';

/** CSVの行をパース（ダブルクォート・カンマ対応） */
function parseRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }
  fields.push(current);
  return fields;
}

/** 既存CSVを読み込みPrintingCompany配列として返す */
export function readCompanyCsv(filePath: string): PrintingCompany[] {
  let content = fs.readFileSync(filePath, 'utf-8');

  // BOM除去
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const lines = content.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  // ヘッダー行をスキップ
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    const fields = parseRow(line);
    return {
      name: fields[0] || '',
      address: fields[1] || '',
      phone: fields[2] || '',
      website: fields[3] || '',
      rating: fields[4] ? parseFloat(fields[4]) || null : null,
      reviewCount: fields[5] ? parseInt(fields[5], 10) || 0 : 0,
      prefecture: fields[6] || '',
      placeId: fields[7] || '',
      businessStatus: 'OPERATIONAL',
      types: [],
    };
  });
}
