// app/api/corporate/users/invite/accept/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logCorporateActivity } from '@/lib/utils/activity-logger';

export async function POST(request: Request) {
  try {
    const { token, password, lastName, firstName, lastNameKana, firstNameKana, name } =
      await request.json();

    // デバッグログ
    console.log('招待受け入れリクエスト:', {
      token: token ? '存在します' : '存在しません',
      password: password ? 'セットされています' : 'セットされていません',
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      name,
    });

    if (!token || !password) {
      return NextResponse.json({ error: 'トークンとパスワードが必要です' }, { status: 400 });
    }

    // トークンを検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: true, // テナント情報を取得
          },
        },
      },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ error: 'トークンが無効または期限切れです' }, { status: 400 });
    }

    // 関連するテナント情報を取得
    const tenantInfo = await prisma.corporateTenant.findFirst({
      where: {
        users: {
          some: {
            id: resetToken.userId,
          },
        },
      },
    });

    if (!tenantInfo) {
      console.log('警告: ユーザーに関連するテナントが見つかりません:', resetToken.userId);
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 姓名を結合したname値の生成（必要な場合）
    const fullName = name || `${lastName || ''} ${firstName || ''}`.trim();

    // トランザクションでユーザー情報を更新
    await prisma.$transaction(async (tx) => {
      // ユーザー情報を更新
      await tx.user.update({
        // 変数に代入しない
        where: { id: resetToken.userId },
        data: {
          // 必須フィールド
          password: hashedPassword,
          emailVerified: new Date(), // 認証済みにする

          // 姓名と関連フィールド - 送信されていれば更新
          name: fullName || undefined,
          lastName: lastName || undefined,
          firstName: firstName || undefined,
          lastNameKana: lastNameKana || undefined,
          firstNameKana: firstNameKana || undefined,

          // 法人メンバーとしての役割を設定
          corporateRole: 'member',
        },
      });

      // 使用済みトークンを削除
      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      // テナントがある場合はアクティビティログを記録
      if (tenantInfo) {
        await logCorporateActivity({
          tenantId: tenantInfo.id,
          userId: resetToken.userId,
          action: 'accept_invite',
          entityType: 'user',
          entityId: resetToken.userId,
          description: `${fullName}さんが法人テナントに参加しました`,
        });
      }
    });

    // デバッグログ
    console.log('ユーザー更新完了:', {
      userId: resetToken.userId,
      name: fullName,
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      tenantId: tenantInfo?.id || 'なし',
    });

    return NextResponse.json({
      success: true,
      tenantId: tenantInfo?.id,
      hasTenanct: !!tenantInfo,
    });
  } catch (error) {
    console.error('招待受け入れエラー:', error);
    return NextResponse.json({ error: '招待の受け入れ中にエラーが発生しました' }, { status: 500 });
  }
}