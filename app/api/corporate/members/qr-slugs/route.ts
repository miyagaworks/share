// app/api/corporate/members/qr-slugs/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // テナント管理者かチェック
    const tenant = await prisma.corporateTenant.findFirst({
      where: { adminId: session.user.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            qrCodePages: {
              select: {
                slug: true,
                id: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: '法人管理者権限が必要です' }, { status: 403 });
    }

    // メンバー情報とQRスラッグを整理
    const memberSlugs = tenant.users.map((user) => ({
      userId: user.id,
      name: user.name || '名前未設定',
      email: user.email,
      existingSlugs: user.qrCodePages.map((qr) => qr.slug),
      hasNoSlug: user.qrCodePages.length === 0,
    }));

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      tenantName: tenant.name,
      members: memberSlugs,
    });
  } catch (error) {
    logger.error('メンバーQRスラッグ取得エラー:', error);
    return NextResponse.json({ error: 'メンバー情報の取得に失敗しました' }, { status: 500 });
  }
}