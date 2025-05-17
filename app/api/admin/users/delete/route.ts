// app/api/admin/users/delete/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access';

export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(request: Request) {
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

    // リクエストボディを取得
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    // 削除対象ユーザーが存在するか確認（より詳細な情報を取得）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true, // 追加: テナントID
        corporateRole: true, // 追加: 法人ロール
        departmentId: true, // 追加: 部署ID
        adminOfTenant: {
          select: {
            id: true,
            name: true,
            subscription: {
              select: {
                status: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 管理者自身は削除不可
    if (user.email === 'admin@sns-share.com') {
      return NextResponse.json({ error: '管理者アカウントは削除できません' }, { status: 403 });
    }

    // 法人テナント管理者の場合の追加チェック
    if (user.adminOfTenant) {
      // サブスクリプションが存在し、アクティブ状態であるか確認
      if (
        user.adminOfTenant.subscription &&
        user.adminOfTenant.subscription.status === 'active' &&
        new Date(user.adminOfTenant.subscription.currentPeriodEnd) > new Date()
      ) {
        return NextResponse.json({
          error: '法人プラン管理者は有効なサブスクリプション期間内に削除できません',
          details: `${user.adminOfTenant.name}の管理者を削除するには、管理者権限を他のメンバーに移譲するか、サブスクリプション期間（${new Date(user.adminOfTenant.subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}まで）の終了を待つ必要があります。`,
          isCorporateAdmin: true, // フロントエンドで法人管理者エラーを識別するためのフラグ
          status: 403,
        });
      }
    }

    try {
      // トランザクションを使用して一括で削除処理
      await prisma.$transaction(async (tx) => {
        // ユーザーのプロフィールを削除
        await tx.profile.deleteMany({
          where: { userId: userId },
        });

        // ユーザーのSNSリンクを削除
        await tx.snsLink.deleteMany({
          where: { userId: userId },
        });

        // ユーザーのカスタムリンクを削除
        await tx.customLink.deleteMany({
          where: { userId: userId },
        });

        // ユーザーのサブスクリプションを削除
        await tx.subscription.deleteMany({
          where: { userId: userId },
        });

        // ユーザーの請求履歴を削除
        await tx.billingRecord.deleteMany({
          where: { userId: userId },
        });

        // ユーザーのアカウントを削除
        await tx.account.deleteMany({
          where: { userId: userId },
        });

        // ユーザーが法人メンバーの場合、テナントからの関連を解除
        if (user.tenantId) {
          await tx.user.update({
            where: { id: userId },
            data: {
              tenantId: null,
              corporateRole: null,
              departmentId: null,
            },
          });
        }

        // 最後にユーザー自体を削除
        await tx.user.delete({
          where: { id: userId },
        });
      });

      console.log(`ユーザー削除完了: ${user.email}`);

      return NextResponse.json({
        success: true,
        message: `ユーザー ${user.name || user.email} を削除しました`,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (dbError) {
      console.error('ユーザー削除中のデータベースエラー:', dbError);

      // 外部キー制約エラーの場合、より具体的なエラーメッセージ
      if (dbError instanceof Error && dbError.message.includes('Foreign key constraint')) {
        if (dbError.message.includes('CorporateTenant_adminId_fkey')) {
          return NextResponse.json(
            {
              error: '法人プラン管理者は削除できません',
              details: '管理者権限を他のメンバーに移譲してから削除してください。',
              isCorporateAdmin: true, // フロントエンドで法人管理者エラーを識別するためのフラグ
            },
            { status: 403 },
          );
        }

        return NextResponse.json(
          {
            error: 'このユーザーは他のデータと関連付けられているため削除できません',
            details: dbError.message,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error: 'ユーザー削除中にエラーが発生しました',
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return NextResponse.json({ error: 'ユーザー削除に失敗しました' }, { status: 500 });
  }
}