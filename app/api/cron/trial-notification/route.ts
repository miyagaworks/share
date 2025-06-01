// app/api/cron/trial-notification/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { sendTrialEndingEmails, checkExpiredGracePeriods } from '@/lib/utils/subscription';
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
      logger.debug('認証に失敗しました');
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401, headers });
    }
    logger.debug('トライアル通知処理を開始します');
    // トライアル終了通知メールを送信
    const trialResult = await sendTrialEndingEmails();
    logger.debug('トライアル終了通知処理が完了しました', trialResult);
    // 猶予期間終了ユーザーをチェックして管理者に通知
    logger.debug('猶予期間終了チェックを開始します');
    const graceResult = await checkExpiredGracePeriods();
    logger.debug('猶予期間終了チェックが完了しました', graceResult);
    return NextResponse.json(
      {
        success: true,
        trial: trialResult,
        gracePeriod: graceResult,
      },
      { headers },
    );
  } catch (error) {
    logger.error('トライアル通知スケジュールエラー:', error);
    return NextResponse.json(
      {
        error: '処理中にエラーが発生しました',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers },
    );
  }
}