// app/api/auth/[...nextauth]/route.ts
export const dynamic = 'force-dynamic';

import { handlers } from '@/auth';
import { logger } from "@/lib/utils/logger";
import { NextRequest, NextResponse } from 'next/server';

// エラーハンドリングを追加したGETハンドラー
export async function GET(request: NextRequest) {
  try {
    logger.debug('[NextAuth GET] リクエスト受信:', {
      url: request.url,
      pathname: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    });

    const response = await handlers.GET(request);
    
    logger.debug('[NextAuth GET] レスポンス送信:', {
      status: response.status,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    logger.error('[NextAuth GET] エラー発生:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        error: 'Authentication service error',
        message: 'NextAuth APIでエラーが発生しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// エラーハンドリングを追加したPOSTハンドラー
export async function POST(request: NextRequest) {
  try {
    logger.debug('[NextAuth POST] リクエスト受信:', {
      url: request.url,
      pathname: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    });

    const response = await handlers.POST(request);
    
    logger.debug('[NextAuth POST] レスポンス送信:', {
      status: response.status,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    logger.error('[NextAuth POST] エラー発生:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        error: 'Authentication service error',
        message: 'NextAuth APIでエラーが発生しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}