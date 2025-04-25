// app/api/corporate/users/[id]/resend-invite/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log(`[API] /api/corporate/users/${params.id}/resend-invite POSTリクエスト受信`);

    // セッション認証チェック - authを使用
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 古いトークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: params.id },
    });

    // 新しいトークンを生成
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72時間有効

    // 新しいトークンを作成
    await prisma.passwordResetToken.create({
      data: {
        token,
        expires: expiresAt,
        userId: params.id,
      },
    });

    // ユーザー情報を更新
    await prisma.user.update({
      where: { id: params.id },
      data: {
        emailVerified: null, // 未確認状態に設定
      },
    });

    return NextResponse.json({
      success: true,
      message: '招待を再送信しました',
    });
  } catch (error) {
    console.error(`[API] 招待再送信エラー:`, error);
    return NextResponse.json(
      {
        error: '招待の再送信に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// ランダムな招待トークンを生成する関数を追加
function generateInviteToken(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}