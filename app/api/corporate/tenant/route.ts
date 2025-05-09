export const dynamic = "force-dynamic";
// app/api/corporate/tenant/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[API] /api/corporate/tenant リクエスト受信');

    // セッション認証チェック
    const session = await auth();

    if (!session || !session.user?.id) {
      console.log('[API] 認証されていないアクセス');
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('[API] ユーザーID:', userId);

    // 例外処理の強化
    try {
      // ユーザーの法人テナント情報を取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          adminOfTenant: {
            include: {
              subscription: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  corporateRole: true,
                },
              },
              departments: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          tenant: {
            include: {
              subscription: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  corporateRole: true,
                },
              },
              departments: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          subscription: true,
        },
      });

      // ユーザーが見つからない場合
      if (!user) {
        console.log('[API] ユーザーが見つかりません:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 法人テナント情報を取得（管理者または一般メンバー）
      const tenant = user.adminOfTenant || user.tenant;

      // テナントが見つからない場合
      if (!tenant) {
        console.log('[API] テナントが見つかりません:', userId);
        return NextResponse.json({ 
          error: 'No tenant associated with this user',
          // エラーレスポンスでも最小限の情報を提供
          isAdmin: false,
          hasTenant: false
        }, { status: 404 });
      }

      // 管理者権限の確認
      const isAdmin = !!user.adminOfTenant;
      const userRole = isAdmin ? 'admin' : 'member';

      console.log('[API] テナント情報取得成功:', {
        hasAdminTenant: !!user.adminOfTenant,
        hasTenant: !!user.tenant,
        hasSubscription: !!user.subscription,
        isAdmin,
        userRole,
      });

      // アカウント停止状態確認
      if (tenant.accountStatus === 'suspended') {
        console.log('[API] テナントは停止状態です:', tenant.id);
        return NextResponse.json(
          {
            error: 'Account is suspended',
            tenant: {
              id: tenant.id,
              name: tenant.name,
              accountStatus: 'suspended',
            },
            isAdmin,
            userRole,
          },
          { status: 403 },
        );
      }

      console.log('[API] テナント情報返却:', tenant.id);

      // 正常レスポンス - ユーザーロールとisAdminフラグを追加
      return NextResponse.json({
        tenant,
        isAdmin,
        userRole,
      });
    } catch (dbError) {
      // データベースエラーのより詳細なロギングと処理
      console.error('[API] データベースエラー:', dbError);
      return NextResponse.json(
        {
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : String(dbError),
          code: 'DB_ERROR',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] テナント情報取得エラー:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tenant information',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        code: 'API_ERROR',
      },
      { status: 500 },
    );
  }
}