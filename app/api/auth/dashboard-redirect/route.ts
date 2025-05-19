// app/api/auth/dashboard-redirect/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', process.env.NEXTAUTH_URL as string));
  }

  const userId = session.user.id;

  try {
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        adminOfTenant: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', process.env.NEXTAUTH_URL as string));
    }

    // 法人テナント管理者の場合
    if (user.adminOfTenant) {
      return NextResponse.redirect(
        new URL('/dashboard/corporate', process.env.NEXTAUTH_URL as string),
      );
    }

    // 法人テナントメンバーの場合
    if (user.tenant) {
      return NextResponse.redirect(
        new URL('/dashboard/corporate-member', process.env.NEXTAUTH_URL as string),
      );
    }

    // それ以外は個人ダッシュボード
    return NextResponse.redirect(new URL('/dashboard/profile', process.env.NEXTAUTH_URL as string));
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return NextResponse.redirect(new URL('/dashboard/profile', process.env.NEXTAUTH_URL as string));
  }
}