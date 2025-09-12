// app/api/user/auth-methods/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        password: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasGoogleAuth = user.accounts.some((acc) => acc.provider === 'google');
    const hasPassword = !!user.password;

    return NextResponse.json({
      hasGoogleAuth,
      hasPassword,
      email: user.email,
    });
  } catch (error) {
    console.error('Auth methods check error:', error);
    return NextResponse.json({ error: 'Failed to check auth methods' }, { status: 500 });
  }
}