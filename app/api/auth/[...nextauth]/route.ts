// app/api/auth/[...nextauth]/route.ts
export const dynamic = 'force-dynamic';
import { handlers } from '@/auth';

export const GET = handlers.GET;
export const POST = handlers.POST;