// app/api/admin/fix-permanent-users/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 結果の型定義
interface SuccessResult {
  userId: string;
  email: string;
  tenantId: string;
  status: string;
}

interface ErrorResult {
  userId: string;
  email: string;
  error: string;
}

export async function GET() {
  try {
    // 管理者認証
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者かどうか確認（メールアドレスで）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user || user.email !== 'admin@sns-share.com') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // subscriptionStatusが'permanent'のユーザーを検索
    const permanentUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'permanent',
        // テナント関連付けがないユーザーのみを対象に
        tenantId: null,
        adminOfTenant: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const results: SuccessResult[] = [];
    const errors: ErrorResult[] = [];

    // 各ユーザーに対して処理
    for (const user of permanentUsers) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. テナントを作成
          const tenant = await tx.corporateTenant.create({
            data: {
              name: `${user.name || user.email || 'ユーザー'}の法人`,
              maxUsers: 50,
              primaryColor: '#3B82F6',
              secondaryColor: '#60A5FA',
              admin: { connect: { id: user.id } },
              // デフォルト部署も作成
              departments: {
                create: {
                  name: '全社',
                  description: 'デフォルト部署',
                },
              },
            },
          });

          // 2. ユーザーをテナントに関連付け
          await tx.user.update({
            where: { id: user.id },
            data: {
              tenant: { connect: { id: tenant.id } },
              corporateRole: 'admin',
            },
          });

          // 3. デフォルトのSNSリンク設定を作成
          const defaultSnsLinks = [
            { platform: 'line', url: 'https://line.me/ti/p/~', displayOrder: 1 },
            { platform: 'instagram', url: 'https://www.instagram.com/', displayOrder: 2 },
            { platform: 'youtube', url: 'https://www.youtube.com/c/', displayOrder: 3 },
          ];

          for (const snsLink of defaultSnsLinks) {
            await tx.corporateSnsLink.create({
              data: {
                ...snsLink,
                tenant: { connect: { id: tenant.id } },
              },
            });
          }

          results.push({
            userId: user.id,
            email: user.email,
            tenantId: tenant.id,
            status: '成功',
          });
        });
      } catch (error) {
        errors.push({
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalUsers: permanentUsers.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}