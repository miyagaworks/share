// app/api/auth/error/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error');
    
    // エラーログを記録
    logger.error('[Auth Error API] 認証エラー発生:', {
      error,
      url: request.url,
      timestamp: new Date().toISOString()
    });
    
    // エラーメッセージの整形
    let errorMessage = '認証エラーが発生しました';
    let statusCode = 400;
    
    if (error === 'CredentialsSignin') {
      errorMessage = 'メールアドレスまたはパスワードが間違っています';
    } else if (error === 'SessionRequired') {
      errorMessage = 'このページにアクセスするにはログインが必要です';
    } else if (error === 'Configuration') {
      errorMessage = 'サーバー設定エラーが発生しました';
      statusCode = 500;
    } else if (error === 'AccessDenied') {
      errorMessage = 'アクセスが拒否されました';
      statusCode = 403;
    } else if (error === 'Verification') {
      errorMessage = 'メール認証エラーが発生しました';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorCode: error,
        timestamp: new Date().toISOString()
      }, 
      { status: statusCode }
    );
    
  } catch (err) {
    logger.error('[Auth Error API] API処理エラー:', err);
    
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}