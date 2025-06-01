// app/api/admin/profiles/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }
    // すべてのユーザーとそのプロフィール、QRコード情報を取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        nameKana: true,
        nameEn: true,
        email: true,
        image: true,
        bio: true,
        company: true,
        phone: true,
        mainColor: true,
        createdAt: true,
        subscriptionStatus: true,
        // プロフィール情報
        profile: {
          select: {
            slug: true,
            views: true,
            isPublic: true,
            lastAccessed: true,
          },
        },
        // QRコードページ情報
        qrCodePages: {
          select: {
            id: true,
            slug: true,
            views: true,
            primaryColor: true,
            lastAccessed: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        // SNSリンク情報
        snsLinks: {
          select: {
            platform: true,
            url: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        // カスタムリンク情報
        customLinks: {
          select: {
            name: true,
            url: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        // 法人テナント情報
        tenant: {
          select: {
            name: true,
            primaryColor: true,
            logoUrl: true,
          },
        },
        adminOfTenant: {
          select: {
            name: true,
            primaryColor: true,
            logoUrl: true,
          },
        },
        // 部署情報
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    // レスポンス用にデータを整形
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      nameKana: user.nameKana,
      nameEn: user.nameEn,
      email: user.email,
      image: user.image,
      bio: user.bio,
      company: user.company,
      phone: user.phone,
      mainColor: user.mainColor,
      createdAt: user.createdAt.toISOString(),
      subscriptionStatus: user.subscriptionStatus,
      profile: user.profile
        ? {
            slug: user.profile.slug,
            views: user.profile.views,
            isPublic: user.profile.isPublic,
            lastAccessed: user.profile.lastAccessed?.toISOString() || null,
          }
        : null,
      qrCodePages: user.qrCodePages.map((qr) => ({
        id: qr.id,
        slug: qr.slug,
        views: qr.views,
        primaryColor: qr.primaryColor,
        lastAccessed: qr.lastAccessed?.toISOString() || null,
        createdAt: qr.createdAt.toISOString(),
      })),
      snsLinks: user.snsLinks,
      customLinks: user.customLinks,
      tenant: user.tenant || user.adminOfTenant || null,
      department: user.department,
    }));
    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    logger.error('プロフィール一覧取得エラー:', error);
    return NextResponse.json({ error: 'プロフィール一覧の取得に失敗しました' }, { status: 500 });
  }
}