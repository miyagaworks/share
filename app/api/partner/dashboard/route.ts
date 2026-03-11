// app/api/partner/dashboard/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { countPartnerAccounts, checkAccountLimit } from '@/lib/partner/accounts';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // パートナー管理者かどうかを確認
    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: {
        id: true,
        name: true,
        brandName: true,
        plan: true,
        accountStatus: true,
        maxAccounts: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 403 });
    }

    // 統計情報を並列取得
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [accountLimit, totalTenants, newUsersThisMonth, profileViews] = await Promise.all([
      checkAccountLimit(partner.id),
      prisma.corporateTenant.count({
        where: { partnerId: partner.id },
      }),
      prisma.user.count({
        where: {
          OR: [
            { partnerId: partner.id, createdAt: { gte: startOfMonth } },
            { tenant: { partnerId: partner.id }, createdAt: { gte: startOfMonth } },
          ],
        },
      }),
      prisma.profile.aggregate({
        _sum: { views: true },
        where: {
          user: {
            OR: [
              { partnerId: partner.id },
              { tenant: { partnerId: partner.id } },
            ],
          },
        },
      }),
    ]);

    return NextResponse.json({
      partner: {
        name: partner.name,
        brandName: partner.brandName,
        plan: partner.plan,
        accountStatus: partner.accountStatus,
      },
      stats: {
        totalTenants,
        totalAccounts: accountLimit.currentCount,
        maxAccounts: accountLimit.maxAccounts,
        newUsersThisMonth,
        totalProfileViews: profileViews._sum.views || 0,
      },
      warningLevel: accountLimit.warningLevel,
    });
  } catch (error) {
    console.error('Partner dashboard API error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
