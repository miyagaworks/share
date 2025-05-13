// app/api/admin/access/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/utils/admin-access';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          isSuperAdmin: false,
          error: '認証されていません',
        },
        { status: 401 },
      );
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);

    return NextResponse.json({
      isSuperAdmin: isAdmin,
      userId: session.user.id,
      email: session.user.email,
    });
  } catch (error) {
    console.error('管理者アクセスチェックエラー:', error);
    return NextResponse.json(
      {
        isSuperAdmin: false,
        error: '管理者アクセスチェック中にエラーが発生しました',
      },
      { status: 500 },
    );
  }
}