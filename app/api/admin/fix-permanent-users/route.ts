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

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

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

    for (const user of permanentUsers) {
      try {
        await prisma.$transaction(async (tx) => {
          const actions: string[] = [];
          let planType = 'personal';
          let subscriptionPlan = 'permanent_personal';

          // 🔥 新しいプラン構成に合わせた判定
          if (user.adminOfTenant) {
            const maxUsers = user.adminOfTenant.maxUsers;
            if (maxUsers >= 50) {
              planType = 'enterprise';
              subscriptionPlan = 'permanent_enterprise';
            } else if (maxUsers >= 30) {
              planType = 'business'; // 🔥 business_plus → business
              subscriptionPlan = 'permanent_business';
            } else {
              planType = 'starter'; // 🔥 business → starter
              subscriptionPlan = 'permanent_starter';
            }
          } else if (user.tenant) {
            // メンバーの場合はスタータープランとして設定
            planType = 'starter'; // 🔥 business → starter
            subscriptionPlan = 'permanent_starter';
          }

          // 🔥 サブスクリプション情報を修正
          if (user.subscription) {
            if (user.subscription.plan !== subscriptionPlan) {
              await tx.subscription.update({
                where: { userId: user.id },
                data: {
                  plan: subscriptionPlan,
                  interval: 'permanent',
                  status: 'active',
                  subscriptionId:
                    user.subscription.subscriptionId || `permanent_${user.id}_${Date.now()}`,
                },
              });
              actions.push(`サブスクリプションプランを${subscriptionPlan}に更新`);
            }
          } else {
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

          // 🔥 テナントのオンボーディング完了とsubscriptionId設定
          if (user.adminOfTenant) {
            const subscriptionId =
              user.subscription?.subscriptionId || `permanent_${user.id}_${Date.now()}`;

            await tx.corporateTenant.update({
              where: { id: user.adminOfTenant.id },
              data: {
                onboardingCompleted: true,
                subscriptionId: subscriptionId,
              },
            });
            actions.push('テナントのオンボーディング完了とsubscriptionId設定');

            // デフォルト部署の確認・作成
            const defaultDepartment = user.adminOfTenant.departments.find(
              (dept) => dept.name === '全社',
            );

            let defaultDepartmentId = null;
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

          results.push({
            userId: user.id,
            email: user.email,
            action: actions.join(', ') || '変更なし',
            planType: planType as any,
            tenantId: user.adminOfTenant?.id || user.tenant?.id,
            departmentId: user.departmentId || undefined,
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