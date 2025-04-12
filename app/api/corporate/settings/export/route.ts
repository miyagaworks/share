// app/api/corporate/settings/export/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });

    if (!user || !user.adminOfTenant) {
      return NextResponse.json(
        { error: 'データエクスポートには管理者権限が必要です' },
        { status: 403 },
      );
    }

    const tenantId = user.adminOfTenant.id;

    // テナントのユーザー一覧を取得
    const tenantUsers = await prisma.user.findMany({
      where: {
        tenantId: tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        corporateRole: true,
        department: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
    });

    // テナントの部署一覧を取得
    const departments = await prisma.department.findMany({
      where: {
        tenantId: tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // テナントのプロフィール情報を取得
    const profiles = await prisma.profile.findMany({
      where: {
        user: {
          tenantId: tenantId,
        },
      },
      select: {
        id: true,
        userId: true,
        slug: true,
        views: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // CSV形式のデータを生成
    const usersCSV = generateUsersCSV(tenantUsers);
    const departmentsCSV = generateDepartmentsCSV(departments);
    const profilesCSV = generateProfilesCSV(profiles);

    // エクスポートデータをまとめる
    const exportData = {
      companyName: user.adminOfTenant.name,
      exportDate: new Date().toISOString(),
      users: tenantUsers,
      departments: departments,
      profiles: profiles,
      usersCSV,
      departmentsCSV,
      profilesCSV,
    };

    // エクスポート履歴を記録（オプション）
    // const exportLog = await prisma.tenantExportLog.create({
    //   data: {
    //     tenantId: tenantId,
    //     exportedBy: session.user.id,
    //     exportType: 'full',
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'データのエクスポートに成功しました',
      data: exportData,
    });
  } catch (error) {
    console.error('データエクスポートエラー:', error);
    return NextResponse.json({ error: 'データのエクスポートに失敗しました' }, { status: 500 });
  }
}

// ユーザーデータの型定義
interface UserData {
  id: string;
  email: string;
  name: string | null;
  position: string | null;
  corporateRole: string | null;
  department?: {
    name: string;
  } | null;
  createdAt: Date;
}

// ユーザーデータをCSV形式に変換
function generateUsersCSV(users: UserData[]) {
  // ヘッダー行
  const headers = ['ID', 'メールアドレス', '名前', '役職', '権限', '部署', '作成日'];

  // データ行
  const rows = users.map((user) => [
    user.id,
    user.email,
    user.name || '',
    user.position || '',
    user.corporateRole || 'member',
    user.department?.name || '',
    new Date(user.createdAt).toLocaleDateString('ja-JP'),
  ]);

  // CSVとして結合
  return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
}

// 部署データの型定義
interface DepartmentData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 部署データをCSV形式に変換
function generateDepartmentsCSV(departments: DepartmentData[]) {
  // ヘッダー行
  const headers = ['ID', '部署名', '説明', '作成日', '更新日'];

  // データ行
  const rows = departments.map((dept) => [
    dept.id,
    dept.name,
    dept.description || '',
    new Date(dept.createdAt).toLocaleDateString('ja-JP'),
    new Date(dept.updatedAt).toLocaleDateString('ja-JP'),
  ]);

  // CSVとして結合
  return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
}

// プロフィールデータの型定義
interface ProfileData {
  id: string;
  userId: string;
  slug: string;
  views: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// プロフィールデータをCSV形式に変換
function generateProfilesCSV(profiles: ProfileData[]) {
  // ヘッダー行
  const headers = ['ID', 'ユーザーID', 'スラッグ', '閲覧数', '公開状態', '作成日', '更新日'];

  // データ行
  const rows = profiles.map((profile) => [
    profile.id,
    profile.userId,
    profile.slug,
    profile.views.toString(),
    profile.isPublic ? '公開' : '非公開',
    new Date(profile.createdAt).toLocaleDateString('ja-JP'),
    new Date(profile.updatedAt).toLocaleDateString('ja-JP'),
  ]);

  // CSVとして結合
  return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
}