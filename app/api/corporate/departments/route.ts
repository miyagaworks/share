// app/api/corporate/departments/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logCorporateActivity } from '@/lib/utils/activity-logger';
import { checkPermanentAccess, generateVirtualTenantData } from '@/lib/corporateAccess';
// 部署一覧取得（GET）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // ユーザーのテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true, // 永久利用権ユーザー判定用
        adminOfTenant: true,
        tenant: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 永久利用権ユーザーの場合、仮想テナントの部署情報を返す
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('永久利用権ユーザー用仮想部署情報の生成:', user.id);
      const virtualTenant = generateVirtualTenantData(user.id, user.name);
      // 仮想部署データをユーザー数とともに整形
      const virtualDepartments = virtualTenant.departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        userCount: 1, // 自分だけが所属
      }));
      return NextResponse.json({
        success: true,
        departments: virtualDepartments,
      });
    }
    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;
    if (!tenant) {
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }
    // 部署情報を取得（ユーザー数を含む）
    const departments = await prisma.department.findMany({
      where: { tenantId: tenant.id },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });
    // レスポンス用にデータを整形（ユーザー数を計算）
    const departmentsWithUserCount = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      userCount: dept.users.length,
    }));
    return NextResponse.json({
      success: true,
      departments: departmentsWithUserCount,
    });
  } catch (error) {
    logger.error('部署情報取得エラー:', error);
    return NextResponse.json({ error: '部署情報の取得に失敗しました' }, { status: 500 });
  }
}
// 部署作成（POST）
export async function POST(req: Request) {
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
        name: true,
        subscriptionStatus: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // isPermanentまたはDBからのsubscriptionStatusが'permanent'の場合
    if (isPermanent || user.subscriptionStatus === 'permanent') {
      // リクエストボディを取得
      const body = await req.json();
      const { name, description } = body;
      logger.debug('永久利用権ユーザーからの部署作成リクエスト:', { body });
      try {
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
        // 必須フィールドの検証
        if (!name || name.trim() === '') {
          return NextResponse.json({ error: '部署名は必須です' }, { status: 400 });
        }
        // 部署を作成
        const newDepartment = await prisma.department.create({
          data: {
            name,
            description,
            tenant: {
              connect: { id: tenant.id },
            },
          },
        });
        // 部署作成後のアクティビティログ
        await logCorporateActivity({
          tenantId: tenant.id,
          userId: session.user.id,
          action: 'create_department',
          entityType: 'department',
          entityId: newDepartment.id,
          description: `部署「${name}」を作成しました`,
          metadata: {
            name,
            description: description || null,
          },
        });
        return NextResponse.json({
          success: true,
          department: newDepartment,
        });
      } catch (error) {
        logger.error('永久利用権ユーザーの部署作成エラー:', error);
        return NextResponse.json({ error: '部署の作成に失敗しました' }, { status: 500 });
      }
    }
    // リクエストボディの取得
    const body = await req.json();
    const { name, description } = body;
    // 必須フィールドの検証
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: '部署名は必須です' }, { status: 400 });
    }
    // ユーザーとテナント情報を取得
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
      return NextResponse.json({ error: '部署の作成には管理者権限が必要です' }, { status: 403 });
    }
    // 部署を作成
    const newDepartment = await prisma.department.create({
      data: {
        name,
        description,
        tenant: {
          connect: { id: adminUser.adminOfTenant.id },
        },
      },
    });
    // 部署作成後のアクティビティログ
    await logCorporateActivity({
      tenantId: adminUser.adminOfTenant.id,
      userId: session.user.id,
      action: 'create_department',
      entityType: 'department',
      entityId: newDepartment.id,
      description: `部署「${name}」を作成しました`,
      metadata: {
        name,
        description: description || null,
      },
    });
    return NextResponse.json({
      success: true,
      department: newDepartment,
    });
  } catch (error) {
    logger.error('部署作成エラー:', error);
    return NextResponse.json({ error: '部署の作成に失敗しました' }, { status: 500 });
  }
}