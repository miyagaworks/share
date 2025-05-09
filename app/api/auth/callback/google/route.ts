// app/api/auth/callback/google/route.ts
export const dynamic = 'force-dynamic';

import { auth } from '@/auth';

// GETとPOSTの両方のハンドラーをインポート
export const GET = auth;
export const POST = auth;