export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getProviders } from 'next-auth/react';

export async function GET() {
  const providers = await getProviders();
  return NextResponse.json(providers || {});
}