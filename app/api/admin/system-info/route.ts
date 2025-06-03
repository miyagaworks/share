// app/api/admin/system-info/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/utils/admin-access-server';
import { logger } from '@/lib/utils/logger';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // package.jsonからバージョン情報を取得
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

    // システム情報
    const systemInfo = {
      version: packageJson.version,
      name: packageJson.name,
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ systemInfo });
  } catch (error) {
    logger.error('システム情報取得エラー:', error);
    return NextResponse.json({ error: 'システム情報の取得に失敗しました' }, { status: 500 });
  }
}