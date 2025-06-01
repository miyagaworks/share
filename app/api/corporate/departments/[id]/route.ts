// app/api/corporate/departments/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkPermanentAccess, getVirtualTenantData } from '@/lib/corporateAccess';
// 部署詳細取得（GET）
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // 永久利用権ユーザーかどうかチェック
  const isPermanent = checkPermanentAccess();
  if (isPermanent) {
    // 仮想テナントデータから部署情報を返す
    const virtualData = getVirtualTenantData();
    if (!virtualData) {
      return NextResponse.json(
        { error: '仮想テナントデータの取得に失敗しました' },
        { status: 500 },
      );
    }
    // 部署IDに一致する部署を仮想データから検索
    const department = virtualData.departments.find((dept) => dept.id === params.id);
    if (!department) {
      return NextResponse.json({ error: '部署が見つかりません' }, { status: 404 });
    }
    // 仮想部署データを返す
    return NextResponse.json({
      success: true,
      department: {
        ...department,
        users: virtualData.users,
      },
    });
  }
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const departmentId = params.id;
    // ユーザーのテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // テナント情報を取得
    const tenant = user.adminOfTenant || user.tenant;
    if (!tenant) {
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }
    // 部署情報を取得（所属ユーザーを含む）
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
        tenantId: tenant.id, // アクセス権の確認
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
        },
      },
    });
    if (!department) {
      return NextResponse.json({ error: '部署が見つかりません' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      department,
    });
  } catch (error) {
    logger.error('部署詳細取得エラー:', error);
    return NextResponse.json({ error: '部署情報の取得に失敗しました' }, { status: 500 });
  }
}
// 部署更新（PUT）
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // ユーザー情報を取得（subscriptionStatusのみを取得）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionStatus: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // isPermanentまたはDBからのsubscriptionStatusが'permanent'の場合
    if (isPermanent || user.subscriptionStatus === 'permanent') {
      try {
        // リクエストボディを取得
        const body = await req.json();
        const { name, description } = body;
        logger.debug('永久利用権ユーザーからの部署更新リクエスト:', {
          id: params.id,
          body,
        });
        // 必須フィールドの検証
        if (!name || name.trim() === '') {
          return NextResponse.json({ error: '部署名は必須です' }, { status: 400 });
        }
        // ユーザーのテナント情報を取得
        const userWithTenant = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: {
            adminOfTenant: true,
            tenant: true,
          },
        });
        // テナント情報を取得
        const tenant = userWithTenant?.adminOfTenant || userWithTenant?.tenant;
        if (!tenant) {
          return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
        }
        // 部署の存在確認と所有権確認
        const existingDepartment = await prisma.department.findFirst({
          where: {
            id: params.id,
            tenantId: tenant.id,
          },
        });
        if (!existingDepartment) {
          return NextResponse.json(
            { error: '部署が見つからないか、更新権限がありません' },
            { status: 404 },
          );
        }
        // 部署を更新
        const updatedDepartment = await prisma.department.update({
          where: { id: params.id },
          data: {
            name,
            description,
          },
        });
        return NextResponse.json({
          success: true,
          department: updatedDepartment,
        });
      } catch (error) {
        logger.error('永久利用権ユーザーの部署更新エラー:', error);
        return NextResponse.json({ error: '部署の更新に失敗しました' }, { status: 500 });
      }
    }
    // 通常のユーザー処理
    const departmentId = params.id;
    const body = await req.json();
    const { name, description } = body;
    // 必須フィールドの検証
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: '部署名は必須です' }, { status: 400 });
    }
    // ユーザーとテナント情報を取得 - 管理者権限の確認用
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });
    if (!adminUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 管理者権限の確認
    if (!adminUser.adminOfTenant) {
      return NextResponse.json({ error: '部署の更新には管理者権限が必要です' }, { status: 403 });
    }
    // 部署の存在確認と所有権確認
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId: adminUser.adminOfTenant.id,
      },
    });
    if (!existingDepartment) {
      return NextResponse.json(
        { error: '部署が見つからないか、更新権限がありません' },
        { status: 404 },
      );
    }
    // 部署を更新
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name,
        description,
      },
    });
    return NextResponse.json({
      success: true,
      department: updatedDepartment,
    });
  } catch (error) {
    logger.error('部署更新エラー:', error);
    return NextResponse.json({ error: '部署の更新に失敗しました' }, { status: 500 });
  }
}
// 部署削除（DELETE）
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // セッション認証をまず行う
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      try {
        const departmentId = params.id;
        // ユーザーのテナント情報を取得
        const userWithTenant = await prisma.user.findUnique({
          where: { id: session.user.id }, // sessionはすでに取得済み
          include: {
            adminOfTenant: true,
            tenant: true,
          },
        });
        // テナント情報を取得
        const tenant = userWithTenant?.adminOfTenant || userWithTenant?.tenant;
        if (!tenant) {
          return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
        }
        // 部署の存在確認
        const department = await prisma.department.findFirst({
          where: {
            id: departmentId,
            tenantId: tenant.id,
          },
          include: {
            users: true,
          },
        });
        if (!department) {
          return NextResponse.json(
            { error: '部署が見つからないか、削除権限がありません' },
            { status: 404 },
          );
        }
        // 所属ユーザーがいるかチェック
        if (department.users.length > 0) {
          return NextResponse.json(
            {
              error:
                'ユーザーが所属している部署は削除できません。先にユーザーを移動または削除してください。',
              userCount: department.users.length,
            },
            { status: 400 },
          );
        }
        // 部署を削除
        await prisma.department.delete({
          where: { id: departmentId },
        });
        return NextResponse.json({
          success: true,
          message: '部署が正常に削除されました',
        });
      } catch (error) {
        logger.error('永久利用権ユーザーの部署削除エラー:', error);
        return NextResponse.json({ error: '部署の削除に失敗しました' }, { status: 500 });
      }
    }
    // 以下は通常のユーザー処理（既存コード）
    const departmentId = params.id;
    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 管理者権限の確認
    if (!user.adminOfTenant) {
      return NextResponse.json({ error: '部署の削除には管理者権限が必要です' }, { status: 403 });
    }
    // 部署が所有しているテナントかチェック
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId: user.adminOfTenant.id,
      },
      include: {
        users: true,
      },
    });
    if (!department) {
      return NextResponse.json(
        { error: '部署が見つからないか、削除権限がありません' },
        { status: 404 },
      );
    }
    // 所属ユーザーがいるかチェック
    if (department.users.length > 0) {
      return NextResponse.json(
        {
          error:
            'ユーザーが所属している部署は削除できません。先にユーザーを移動または削除してください。',
          userCount: department.users.length,
        },
        { status: 400 },
      );
    }
    // 部署を削除
    await prisma.department.delete({
      where: { id: departmentId },
    });
    return NextResponse.json({
      success: true,
      message: '部署が正常に削除されました',
    });
  } catch (error) {
    logger.error('部署削除エラー:', error);
    return NextResponse.json({ error: '部署の削除に失敗しました' }, { status: 500 });
  }
}