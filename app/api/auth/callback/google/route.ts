// app/api/auth/callback/google/route.ts
export const dynamic = 'force-dynamic';

import { auth } from '@/auth';

export const GET = auth;
export const POST = auth;