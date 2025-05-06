// app/api/auth/providers/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getProviders } from 'next-auth/react';

export async function GET() {
  try {
    // 実際のプロバイダー情報を取得
    const providers = await getProviders();
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json({ error: '認証エラーが発生しました' }, { status: 500 });
  }
}