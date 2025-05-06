// app/api/auth/session/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    // デバッグ用ログ
    console.log('Session API response:', JSON.stringify(session));
    return NextResponse.json(session || { user: null });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}