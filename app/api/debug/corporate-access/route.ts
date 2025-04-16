// app/api/debug/corporate-access/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザーID
    const userId = session.user.id;

    // 1. ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        corporateRole: true,
        tenantId: true,
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    // 2. 管理者テナント情報
    const adminOfTenant = await prisma.corporateTenant.findUnique({
      where: { adminId: userId },
      select: {
        id: true,
        name: true,
        accountStatus: true,
        subscriptionId: true,
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            userId: true,
          },
        },
      },
    });

    // 3. 一般メンバーとしてのテナント情報
    const memberTenant = user?.tenantId
      ? await prisma.corporateTenant.findUnique({
          where: { id: user.tenantId },
          select: {
            id: true,
            name: true,
            accountStatus: true,
            subscriptionId: true,
            subscription: {
              select: {
                id: true,
                status: true,
                plan: true,
                userId: true,
              },
            },
          },
        })
      : null;

    // 4. データベースのカラム名情報（整合性確認用）
    const tenantColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'CorporateTenant'
    `;

    // クライアントに情報を返す
    return NextResponse.json({
      user,
      adminOfTenant,
      memberTenant,
      schema: {
        tenantColumns,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('デバッグ情報取得エラー:', error);
    return NextResponse.json(
      {
        error: '情報取得エラー',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}