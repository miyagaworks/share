// app/api/corporate/departments/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
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
    console.error('部署情報取得エラー:', error);
    return NextResponse.json({ error: '部署情報の取得に失敗しました' }, { status: 500 });
  }
}

// 部署作成（POST）
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();
    const { name, description } = body;

    // 必須フィールドの検証
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: '部署名は必須です' }, { status: 400 });
    }

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
      return NextResponse.json({ error: '部署の作成には管理者権限が必要です' }, { status: 403 });
    }

    // 部署を作成
    const newDepartment = await prisma.department.create({
      data: {
        name,
        description,
        tenant: {
          connect: { id: user.adminOfTenant.id },
        },
      },
    });

    return NextResponse.json({
      success: true,
      department: newDepartment,
    });
  } catch (error) {
    console.error('部署作成エラー:', error);
    return NextResponse.json({ error: '部署の作成に失敗しました' }, { status: 500 });
  }
}