// app/api/admin/fix-permanent-users/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
import { PermanentPlanType } from '@/lib/corporateAccess';

export const fetchCache = 'force-no-store';
export const revalidate = 0;

// 結果の型定義
interface FixResult {
  userId: string;
  email: string;
  action: string;
  planType?: PermanentPlanType;
  tenantId?: string;
  departmentId?: string;
  subscriptionPlan?: string;
}

interface ErrorResult {
  userId: string;
  email: string;
  error: string;
}

export async function POST() {
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

    // 永久利用権ユーザーを取得
    const permanentUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'permanent',
      },
      include: {
        subscription: true,
        adminOfTenant: {
          include: {
            departments: true,
          },
        },
        tenant: true,
      },
    });

    if (permanentUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: '修正対象の永久利用権ユーザーが見つかりませんでした',
        totalUsers: 0,
        successCount: 0,
        errorCount: 0,
        results: [],
        errors: [],
      });
    }

    const results: FixResult[] = [];
    const errors: ErrorResult[] = [];

    // 各ユーザーを処理
    for (const user of permanentUsers) {
      try {
        await prisma.$transaction(async (tx) => {
          const actions: string[] = [];
          let planType: PermanentPlanType = PermanentPlanType.PERSONAL;
          let subscriptionPlan = 'permanent_personal';

          // 🔥 プラン種別を判定
          if (user.adminOfTenant) {
            // 管理者の場合、テナントのmaxUsersから判定
            const maxUsers = user.adminOfTenant.maxUsers;
            if (maxUsers >= 50) {
              planType = PermanentPlanType.ENTERPRISE;
              subscriptionPlan = 'permanent_enterprise';
            } else if (maxUsers >= 30) {
              planType = PermanentPlanType.BUSINESS_PLUS;
              subscriptionPlan = 'permanent_business_plus';
            } else {
              planType = PermanentPlanType.BUSINESS;
              subscriptionPlan = 'permanent_business';
            }
          } else if (user.tenant) {
            // メンバーの場合、とりあえずビジネスプランとして設定
            planType = PermanentPlanType.BUSINESS;
            subscriptionPlan = 'permanent_business';
          }

          // 🔥 サブスクリプション情報を修正
          if (user.subscription) {
            // 既存のサブスクリプションを更新
            if (user.subscription.plan !== subscriptionPlan) {
              await tx.subscription.update({
                where: { userId: user.id },
                data: {
                  plan: subscriptionPlan,
                  interval: 'permanent',
                  status: 'active',
                },
              });
              actions.push(`サブスクリプションプランを${subscriptionPlan}に更新`);
            }
          } else {
            // サブスクリプション情報が無い場合は作成
            const now = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 100);

            await tx.subscription.create({
              data: {
                userId: user.id,
                status: 'active',
                plan: subscriptionPlan,
                priceId: `price_${subscriptionPlan}`,
                subscriptionId: `permanent_${user.id}_${Date.now()}`,
                currentPeriodStart: now,
                currentPeriodEnd: endDate,
                cancelAtPeriodEnd: false,
                interval: 'permanent',
              },
            });
            actions.push('サブスクリプション情報を作成');
          }

          // 🔥 法人管理者の場合、デフォルト部署を確認・作成
          let defaultDepartmentId = null;
          if (user.adminOfTenant) {
            const defaultDepartment = user.adminOfTenant.departments.find(
              (dept) => dept.name === '全社',
            );

            if (!defaultDepartment) {
              const newDepartment = await tx.department.create({
                data: {
                  name: '全社',
                  description: 'デフォルト部署',
                  tenantId: user.adminOfTenant.id,
                },
              });
              defaultDepartmentId = newDepartment.id;
              actions.push('デフォルト部署を作成');
            } else {
              defaultDepartmentId = defaultDepartment.id;
            }

            // ユーザーに部署が設定されていない場合は設定
            if (!user.departmentId) {
              await tx.user.update({
                where: { id: user.id },
                data: {
                  departmentId: defaultDepartmentId,
                },
              });
              actions.push('デフォルト部署を設定');
            }
          }

          // 結果を記録
          results.push({
            userId: user.id,
            email: user.email,
            action: actions.join(', ') || '変更なし',
            planType,
            tenantId: user.adminOfTenant?.id || user.tenant?.id,
            departmentId: defaultDepartmentId || user.departmentId || undefined,
            subscriptionPlan,
          });
        });

        logger.info('永久利用権ユーザーデータ修正完了', {
          userId: user.id,
          email: user.email,
        });
      } catch (error) {
        logger.error('永久利用権ユーザーデータ修正エラー', {
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
        });

        errors.push({
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : '不明なエラー',
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
    logger.error('永久利用権ユーザーデータ修正API全体エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'データ修正中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}