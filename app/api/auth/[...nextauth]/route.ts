// app/api/auth/[...nextauth]/route.ts (シンプル化版)
export const dynamic = 'force-dynamic';

import { handlers } from '@/auth';

// シンプルなハンドラー
export const { GET, POST } = handlers;