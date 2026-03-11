// app/api/partner/tenants/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkAccountLimit } from '@/lib/partner/accounts';

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

    const tenants = await prisma.corporateTenant.findMany({
      where: { partnerId: partner.id },
      select: {
        id: true,
        name: true,
        accountStatus: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      tenants: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        accountStatus: t.accountStatus,
        userCount: t._count.users,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Partner tenants API error:', error);
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
      select: { id: true, accountStatus: true },
    });

    if (!partner || partner.accountStatus !== 'active') {
      return NextResponse.json({ error: 'パートナーが見つからないか無効です' }, { status: 403 });
    }

    // アカウント上限チェック
    const limit = await checkAccountLimit(partner.id);
    if (!limit.canAddMore) {
      return NextResponse.json(
        { error: 'アカウント数が上限に達しています。プランのアップグレードをご検討ください。' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, adminEmail } = body;

    if (!name || !adminEmail) {
      return NextResponse.json(
        { error: 'テナント名と管理者メールアドレスは必須です' },
        { status: 400 },
      );
    }

    // 管理者ユーザーを検索または作成
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (!adminUser) {
      // 新規ユーザーを作成（招待フロー）
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          name: '',
          mainColor: '#3B82F6',
          subscriptionStatus: 'active',
          partnerId: partner.id,
        },
      });
    }

    // テナント作成
    const tenant = await prisma.corporateTenant.create({
      data: {
        name,
        adminId: adminUser.id,
        maxUsers: 50, // デフォルト値
        partnerId: partner.id,
      },
    });

    // ユーザーをテナントに所属させる
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        tenantId: tenant.id,
        corporateRole: 'admin',
      },
    });

    // アクティビティログ
    await prisma.partnerActivityLog.create({
      data: {
        partnerId: partner.id,
        userId: session.user.id,
        action: 'tenant_created',
        entityType: 'CorporateTenant',
        entityId: tenant.id,
        description: `テナント「${name}」を作成しました`,
      },
    });

    return NextResponse.json({ tenant: { id: tenant.id, name: tenant.name } }, { status: 201 });
  } catch (error) {
    console.error('Partner tenant creation error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
