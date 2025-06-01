// app/api/auth/[...nextauth]/route.ts
export const dynamic = 'force-dynamic';

import { handlers } from '@/auth';
import { logger } from "@/lib/utils/logger";

export const GET = handlers.GET;
export const POST = handlers.POST;