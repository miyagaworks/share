// app/api/partner/demo-accounts/route.ts
// デモアカウントの一覧取得・作成
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: { id: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 403 });
    }

    // デモアカウント一覧（パートナー直属 + テナント所属のデモユーザー）
    const demoUsers = await prisma.user.findMany({
      where: {
        isDemo: true,
        OR: [
          { partnerId: partner.id },
          { tenant: { partnerId: partner.id } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profile: {
          select: {
            slug: true,
            views: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      demoAccounts: demoUsers.map((u) => ({
        id: u.id,
        name: u.name || '',
        email: u.email,
        createdAt: u.createdAt.toISOString(),
        profileSlug: u.profile?.slug || null,
        profileViews: u.profile?.views || 0,
      })),
    });
  } catch (error) {
    console.error('Demo accounts GET error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: { id: true, brandName: true, slug: true, accountStatus: true },
    });

    if (!partner || partner.accountStatus !== 'active') {
      return NextResponse.json({ error: 'パートナーが見つからないか無効です' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: '名前は必須です' }, { status: 400 });
    }

    // デモ用メールアドレスを生成（ユニークにするためにタイムスタンプ付き）
    const timestamp = Date.now();
    const demoEmail = `demo-${partner.slug}-${timestamp}@demo.local`;

    // デモユーザー作成
    const demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        name,
        mainColor: '#3B82F6',
        subscriptionStatus: 'active',
        partnerId: partner.id,
        isDemo: true,
      },
    });

    // デモ用プロフィール作成
    const profileSlug = `demo-${partner.slug}-${timestamp}`;
    const profile = await prisma.profile.create({
      data: {
        userId: demoUser.id,
        slug: profileSlug,
        isPublic: true,
      },
    });

    // アクティビティログ
    await prisma.partnerActivityLog.create({
      data: {
        partnerId: partner.id,
        userId: session.user.id,
        action: 'demo_account_created',
        entityType: 'User',
        entityId: demoUser.id,
        description: `デモアカウント「${name}」を作成しました`,
      },
    });

    return NextResponse.json(
      {
        demoAccount: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          profileSlug: profile.slug,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Demo account creation error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
