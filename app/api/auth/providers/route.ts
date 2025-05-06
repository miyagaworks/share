// app/api/auth/providers/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getProviders } from 'next-auth/react';

export async function GET() {
  try {
    const providers = await getProviders();
    return NextResponse.json(providers || {});
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}