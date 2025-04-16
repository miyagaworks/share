// app/api/debug/corporate-detailed/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { corporateAccessState } from '@/lib/corporateAccessState';

export async function GET() {
  try {
    console.log('[デバッグAPI] リクエスト開始');
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザーID
    const userId = session.user.id;
    console.log('[デバッグAPI] ユーザーID:', userId);

    // 先にユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        corporateRole: true,
        tenantId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true,
          },
        },
      },
    });

    // 診断情報を集める
    const diagnosticInfo = {
      // 1. クライアントグローバル状態
      clientState:
        typeof window !== 'undefined'
          ? {
              corporateAccessState: corporateAccessState,
            }
          : null,

      // 2. 詳細なユーザー情報
      user: await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          corporateRole: true,
          tenantId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          subscription: {
            select: {
              id: true,
              status: true,
              plan: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
              canceledAt: true,
            },
          },
        },
      }),

      // 3. 管理者テナント情報（拡張版）
      adminOfTenant: await prisma.corporateTenant.findUnique({
        where: { adminId: userId },
        select: {
          id: true,
          name: true,
          accountStatus: true,
          subscriptionId: true,
          maxUsers: true,
          createdAt: true,
          updatedAt: true,
          logoUrl: true,
          primaryColor: true,
          securitySettings: true,
          customDomain: true,
          subscription: {
            select: {
              id: true,
              status: true,
              plan: true,
              userId: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
              corporateRole: true,
            },
          },
          departments: {
            select: {
              id: true,
              name: true,
              _count: {
                select: { users: true },
              },
            },
          },
          corporateSnsLinks: {
            select: {
              id: true,
              platform: true,
              isRequired: true,
            },
          },
        },
      }),

      // 4. 一般メンバーとしてのテナント情報（拡張版）
      memberTenant: user?.tenantId
        ? await prisma.corporateTenant.findUnique({
            where: { id: user.tenantId },
            select: {
              id: true,
              name: true,
              accountStatus: true,
              subscriptionId: true,
              maxUsers: true,
              subscription: {
                select: {
                  id: true,
                  status: true,
                  plan: true,
                  userId: true,
                  currentPeriodStart: true,
                  currentPeriodEnd: true,
                },
              },
              admin: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  users: true,
                  departments: true,
                },
              },
            },
          })
        : null,
    };

    // 5. データベースの構造情報（拡張版）
    const schemaInfo = {
      // テナントテーブルの詳細情報
      tenantColumns: await prisma.$queryRaw`
        SELECT column_name, data_type, character_maximum_length, 
               is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'CorporateTenant'
        ORDER BY ordinal_position
      `,

      // 外部キー制約情報
      foreignKeys: await prisma.$queryRaw`
        SELECT
          tc.constraint_name,
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND 
              (tc.table_name = 'CorporateTenant' OR 
               ccu.table_name = 'CorporateTenant')
      `,

      // テーブル間の参照関係
      userToTenantRelations: await prisma.$queryRaw`
        SELECT
          tc.constraint_name,
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND 
              ((tc.table_name = 'User' AND ccu.table_name = 'CorporateTenant') OR
               (tc.table_name = 'CorporateTenant' AND ccu.table_name = 'User'))
      `,
    };

    // 6. アクセス権テスト結果
    const accessTestResults = {
      // APIへの直接アクセステスト（実際には内部的に呼び出し）
      accessCheck: await checkAccessInternally(userId),

      // テナント情報取得テスト
      tenantCheck: await checkTenantInternally(userId),

      // サブスクリプション検証テスト
      subscriptionStatus: await checkSubscriptionInternally(userId),
    };

    // 7. 実行アクション・推奨事項
    const recommendations = generateRecommendations(diagnosticInfo, schemaInfo, accessTestResults);

    console.log('[デバッグAPI] 診断完了');

    // すべての情報をまとめて返す
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      diagnosticInfo,
      schemaInfo,
      accessTestResults,
      recommendations,
      corporateAccessStateSnapshot: corporateAccessState, // グローバル状態のスナップショット
    });
  } catch (error) {
    console.error('[デバッグAPI] エラー発生:', error);
    return NextResponse.json(
      {
        error: '詳細診断情報取得エラー',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// 内部アクセス権チェック関数（APIエンドポイントを模倣）
async function checkAccessInternally(userId: string) {
  try {
    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminOfTenant: true,
        tenant: true,
        subscription: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'ユーザーが見つかりません',
        details: { userId },
      };
    }

    // テナント情報を取得（管理者または一般メンバー）
    const tenant = user.adminOfTenant || user.tenant;

    if (!tenant) {
      return {
        success: false,
        error: 'テナントが見つかりません',
        details: {
          userId,
          hasAdminTenant: !!user.adminOfTenant,
          hasMemberTenant: !!user.tenant,
        },
      };
    }

    // サブスクリプションチェック
    const hasCorporateSubscription =
      user.subscription &&
      (user.subscription.plan === 'business' ||
        user.subscription.plan === 'business-plus' ||
        user.subscription.plan === 'enterprise') &&
      user.subscription.status === 'active';

    if (!hasCorporateSubscription) {
      return {
        success: false,
        error: '有効な法人サブスクリプションがありません',
        details: {
          subscription: user.subscription,
          userHasSubscription: !!user.subscription,
          plan: user.subscription?.plan,
          status: user.subscription?.status,
        },
      };
    }

    // アカウント停止状態確認
    if (tenant.accountStatus === 'suspended') {
      return {
        success: false,
        error: 'テナントが停止状態です',
        details: {
          tenantId: tenant.id,
          accountStatus: tenant.accountStatus,
        },
      };
    }

    return {
      success: true,
      details: {
        userId,
        tenantId: tenant.id,
        tenantStatus: tenant.accountStatus,
        userRole: user.corporateRole,
        isAdmin: !!user.adminOfTenant,
        subscriptionPlan: user.subscription?.plan,
        subscriptionStatus: user.subscription?.status,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'アクセス権チェック中にエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

// テナント情報取得テスト（内部実装）
async function checkTenantInternally(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'ユーザーが見つかりません',
      };
    }

    const tenant = user.adminOfTenant || user.tenant;

    if (!tenant) {
      return {
        success: false,
        error: 'テナントが関連付けられていません',
      };
    }

    return {
      success: true,
      details: {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantStatus: tenant.accountStatus,
        isAdmin: !!user.adminOfTenant,
        isMember: !!user.tenant,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'テナント情報チェック中にエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

// サブスクリプション検証テスト（内部実装）
async function checkSubscriptionInternally(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        adminOfTenant: {
          include: {
            subscription: true,
          },
        },
        tenant: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'ユーザーが見つかりません',
      };
    }

    const userSubscription = user.subscription;
    const tenant = user.adminOfTenant || user.tenant;
    const tenantSubscription = tenant?.subscription;

    return {
      success: true,
      details: {
        userHasSubscription: !!userSubscription,
        userSubscriptionPlan: userSubscription?.plan,
        userSubscriptionStatus: userSubscription?.status,
        tenantHasSubscription: !!tenantSubscription,
        tenantSubscriptionPlan: tenantSubscription?.plan,
        tenantSubscriptionStatus: tenantSubscription?.status,
        tenantSubscriptionId: tenant?.subscriptionId,
        // サブスクリプション間の関連性を確認
        userSubscriptionIdMatchesTenant: userSubscription?.id === tenant?.subscriptionId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'サブスクリプション情報チェック中にエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

// 診断結果に基づく推奨事項生成
function generateRecommendations(diagnosticInfo: any, schemaInfo: any, accessTestResults: any) {
  const recommendations: Array<{
    issue: string;
    severity: 'high' | 'medium' | 'low';
    action: string;
    description: string;
  }> = [];

  // アクセスチェック結果に基づく推奨
  if (!accessTestResults.accessCheck.success) {
    recommendations.push({
      issue: 'アクセス権チェック失敗',
      severity: 'high',
      action: accessTestResults.accessCheck.error.includes('サブスクリプション')
        ? 'サブスクリプション状態の確認'
        : 'テナント・ユーザー関連付けの確認',
      description: `アクセス権チェックが失敗しました: ${accessTestResults.accessCheck.error}`,
    });
  }

  // テナント情報に基づく推奨
  if (!diagnosticInfo.adminOfTenant && !diagnosticInfo.memberTenant) {
    recommendations.push({
      issue: 'テナント関連付けなし',
      severity: 'high',
      action: 'ユーザーをテナントに関連付ける',
      description:
        'ユーザーが法人テナントに関連付けられていません。adminOfTenantまたはtenantの関連を確認してください。',
    });
  }

  // スキーマ情報に基づく推奨
  const columnNames = schemaInfo.tenantColumns.map((col: any) => col.column_name.toLowerCase());
  if (!columnNames.includes('subscriptionid') && !columnNames.includes('subscription_id')) {
    recommendations.push({
      issue: 'スキーマ構造の問題',
      severity: 'high',
      action: 'データベーススキーマの確認',
      description:
        'CorporateTenantテーブルにsubscriptionIdカラムが見つかりません。Prismaスキーマとデータベースの同期が必要かもしれません。',
    });
  }

  // サブスクリプション関連の推奨
  const subCheck = accessTestResults.subscriptionStatus;
  if (subCheck.success && !subCheck.details.userHasSubscription) {
    recommendations.push({
      issue: 'サブスクリプションなし',
      severity: 'high',
      action: 'サブスクリプションの作成',
      description: 'ユーザーに有効なサブスクリプションがありません。',
    });
  }

  if (
    subCheck.success &&
    subCheck.details.tenantHasSubscription &&
    !subCheck.details.userSubscriptionIdMatchesTenant
  ) {
    recommendations.push({
      issue: 'サブスクリプション関連付けの不一致',
      severity: 'medium',
      action: 'サブスクリプション関連の修正',
      description:
        'テナントのサブスクリプションIDとユーザーのサブスクリプションIDが一致していません。',
    });
  }

  // テナント状態に関する推奨
  const tenant = diagnosticInfo.adminOfTenant || diagnosticInfo.memberTenant;
  if (tenant && tenant.accountStatus === 'suspended') {
    recommendations.push({
      issue: 'テナント停止中',
      severity: 'medium',
      action: 'テナントの再アクティブ化',
      description: 'テナントが停止状態です。再アクティブ化が必要です。',
    });
  }

  // 一般的な推奨事項
  recommendations.push({
    issue: 'デバッグモードの活用',
    severity: 'low',
    action: 'CorporateAccessGuardのデバッグモードを有効化',
    description:
      '開発中は`CorporateAccessGuard`コンポーネントの`debugMode`プロパティを`true`に設定して詳細な診断情報を表示することをお勧めします。',
  });

  return recommendations;
}