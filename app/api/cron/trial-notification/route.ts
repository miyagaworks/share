// app/api/cron/trial-notification/route.ts
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

export async function GET(request: Request) {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  try {
    // このAPIを呼び出すときの認証を確認
    if (!validateAuthSecret(request)) {
      console.log('認証に失敗しました');
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401, headers });
    }

    console.log('トライアル終了通知処理を開始します');

    // トライアル終了通知メールを送信
    const result = await sendTrialEndingEmails();

    console.log('トライアル終了通知処理が完了しました', result);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { headers },
    );
  } catch (error) {
    console.error('トライアル終了通知スケジュールエラー:', error);
    return NextResponse.json(
      {
        error: '処理中にエラーが発生しました',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers },
    );
  }
}