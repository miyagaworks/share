// app/api/auth/providers/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 設定済みのプロバイダー情報を直接返す
    const providers = {
      google: { id: 'google', name: 'Google' },
      credentials: { id: 'credentials', name: 'Credentials' },
    };

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
