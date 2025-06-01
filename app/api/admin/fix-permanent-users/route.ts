// app/api/admin/fix-permanent-users/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
// 結果の型定義
interface SuccessResult {
  userId: string;
  email: string;
  tenantId: string;
  departmentId: string;
  stripeCustomerId: string | null;
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
        // テナント関連付けがないユーザーもしくはdepartmentIdがないユーザーを対象に
        OR: [{ tenantId: null, adminOfTenant: null }, { departmentId: null }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        stripeCustomerId: true,
        tenantId: true,
        adminOfTenant: true,
        departmentId: true,
      },
    });
    const results: SuccessResult[] = [];
    const errors: ErrorResult[] = [];
    // 各ユーザーに対して処理
    for (const user of permanentUsers) {
      try {
        await prisma.$transaction(async (tx) => {
          let tenantId: string;
          let departmentId: string;
          let stripeCustomerId = user.stripeCustomerId;
          // StripeCustomerIdが設定されていない場合は設定する
          if (!stripeCustomerId) {
            // モック顧客IDを生成 (実際のStripe統合があればそれを使用)
            stripeCustomerId = `cus_permanent_${user.id.substring(0, 8)}`;
          }
          // 既存のテナント関連付けがあるかチェック
          if (user.tenantId || user.adminOfTenant) {
            // 既存のテナント情報を使用
            tenantId = user.adminOfTenant?.id || user.tenantId || '';
            // 既存テナントの部署を取得
            const existingDepartment = await tx.department.findFirst({
              where: { tenantId },
              orderBy: { createdAt: 'asc' },
            });
            if (existingDepartment) {
              departmentId = existingDepartment.id;
            } else {
              // 部署がない場合は新規作成
              const newDepartment = await tx.department.create({
                data: {
                  name: '全社',
                  description: 'デフォルト部署',
                  tenantId,
                },
              });
              departmentId = newDepartment.id;
            }
          } else {
            // 新規テナントを作成
            const tenant = await tx.corporateTenant.create({
              data: {
                name: `${user.name || user.email || 'ユーザー'}の法人`,
                maxUsers: 50,
                primaryColor: '#3B82F6',
                secondaryColor: '#60A5FA',
                admin: { connect: { id: user.id } },
              },
            });
            tenantId = tenant.id;
            // 新規部署を作成
            const department = await tx.department.create({
              data: {
                name: '全社',
                description: 'デフォルト部署',
                tenantId,
              },
            });
            departmentId = department.id;
            // デフォルトのSNSリンク設定を作成
            const defaultSnsLinks = [
              { platform: 'line', url: 'https://line.me/ti/p/~', displayOrder: 1 },
              { platform: 'instagram', url: 'https://www.instagram.com/', displayOrder: 2 },
              { platform: 'youtube', url: 'https://www.youtube.com/c/', displayOrder: 3 },
            ];
            for (const snsLink of defaultSnsLinks) {
              await tx.corporateSnsLink.create({
                data: {
                  ...snsLink,
                  tenant: { connect: { id: tenantId } },
                },
              });
            }
          }
          // サブスクリプション情報をチェック
          const existingSubscription = await tx.subscription.findUnique({
            where: { userId: user.id },
          });
          // サブスクリプションがない場合は作成
          if (!existingSubscription) {
            const now = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 100); // 100年後（実質永久）
            await tx.subscription.create({
              data: {
                userId: user.id,
                status: 'active',
                plan: 'business_plus',
                priceId: 'price_permanent',
                subscriptionId: `permanent_${user.id}`,
                currentPeriodStart: now,
                currentPeriodEnd: endDate,
                cancelAtPeriodEnd: false,
              },
            });
          }
          // ユーザー情報を更新
          await tx.user.update({
            where: { id: user.id },
            data: {
              departmentId,
              tenantId,
              stripeCustomerId,
              corporateRole: 'admin',
            },
          });
          results.push({
            userId: user.id,
            email: user.email,
            tenantId,
            departmentId,
            stripeCustomerId: stripeCustomerId || null,
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