// app/api/user/check-password/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // セッションの確認
    const session = await auth();

    // 未認証の場合はアクセス拒否
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // ユーザーの取得 - 大文字小文字を区別せずに比較するため、すべてのユーザーから検索
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    // 大文字小文字を無視してメールアドレスが一致するユーザーを探す
    const user = allUsers.find((u) => u.email?.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      return NextResponse.json({ message: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // パスワードの有無を返す（OAuth/ソーシャルログインの場合はnull）
    return NextResponse.json(
      {
        hasPassword: !!user.password,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return NextResponse.json(
      { message: 'ユーザー情報取得中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
