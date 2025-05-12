// /app/api/scheduled/trial-notification/route.ts
import { NextResponse } from 'next/server';
import { sendTrialEndingEmails } from '@/lib/utils/subscription';

// 認証用のシークレットを検証するヘルパー関数
function validateAuthSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  try {
    // このAPIを呼び出すときの認証を確認
    if (!validateAuthSecret(request)) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // トライアル終了通知メールを送信
    const result = await sendTrialEndingEmails();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('トライアル終了通知スケジュールエラー:', error);
    return NextResponse.json(
      {
        error: '処理中にエラーが発生しました',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}