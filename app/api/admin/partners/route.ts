// app/api/admin/partners/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth/constants';
import { countPartnerAccounts } from '@/lib/partner/accounts';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        name: true,
        brandName: true,
        slug: true,
        plan: true,
        accountStatus: true,
        customDomain: true,
        domainVerified: true,
        maxAccounts: true,
        createdAt: true,
        _count: {
          select: { tenants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // アカウント数を並列取得
    const partnersWithCounts = await Promise.all(
      partners.map(async (p) => {
        const totalAccounts = await countPartnerAccounts(p.id);
        return {
          id: p.id,
          name: p.name,
          brandName: p.brandName,
          slug: p.slug,
          plan: p.plan,
          accountStatus: p.accountStatus,
          customDomain: p.customDomain,
          domainVerified: p.domainVerified,
          totalAccounts,
          maxAccounts: p.maxAccounts,
          totalTenants: p._count.tenants,
          createdAt: p.createdAt.toISOString(),
        };
      }),
    );

    return NextResponse.json({ partners: partnersWithCounts });
  } catch (error) {
    console.error('Admin partners API error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { name, brandName, slug, adminEmail, plan } = body;

    if (!name || !brandName || !slug || !adminEmail) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    // スラッグの重複チェック
    const existingPartner = await prisma.partner.findUnique({ where: { slug } });
    if (existingPartner) {
      return NextResponse.json({ error: 'このスラッグは既に使用されています' }, { status: 400 });
    }

    // 管理者ユーザーを検索または作成
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          name: '',
          mainColor: '#3B82F6',
          subscriptionStatus: 'active',
        },
      });
    }

    // 既にパートナー管理者でないか確認
    const existingAdmin = await prisma.partner.findUnique({
      where: { adminUserId: adminUser.id },
    });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'このユーザーは既に他のパートナーの管理者です' },
        { status: 400 },
      );
    }

    // プランに応じたアカウント上限
    const planLimits: Record<string, number> = {
      basic: 300,
      pro: 600,
      premium: 1000,
    };

    // トライアル期間: 3ヶ月
    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);

    const partner = await prisma.partner.create({
      data: {
        name,
        brandName,
        slug,
        plan: plan || 'basic',
        maxAccounts: planLimits[plan || 'basic'] || 300,
        adminUserId: adminUser.id,
        accountStatus: 'trial',
        trialEndsAt,
      },
    });

    return NextResponse.json({ partner: { id: partner.id, name: partner.name } }, { status: 201 });
  } catch (error) {
    console.error('Admin partner creation error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
