// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';

// Next-Auth v5のエクスポート方法
export const { GET, POST } = handlers;