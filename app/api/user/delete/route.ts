// app/api/user/delete/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
// 🔧 修正: 統一されたStripeインスタンスを使用
import { getStripeInstance } from '@/lib/stripe';

export async function DELETE(req: Request) {
  try {
    // セッションの確認
    const session = await auth();
    // 未認証の場合はアクセス拒否
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // JSONのパースエラーを処理
    let password;
    try {
      const body = await req.json();
      password = body.password;
    } catch (error) {
      // リクエストボディが空または不正な場合
      logger.debug('リクエストボディのパースエラー:', error);
    }

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

    // OAuth（ソーシャルログイン）ユーザーの場合、パスワード検証をスキップできるようにする
    if (!user.password) {
      // パスワードがnullのユーザー（OAuth）の場合はパスワード不要
      logger.debug('OAuthユーザーのためパスワード検証をスキップします');
    } else if (!password) {
      // 通常のユーザーの場合はパスワードが必要
      return NextResponse.json({ message: 'パスワードが必要です' }, { status: 400 });
    }

    // OAuth（ソーシャルログイン）ユーザーの場合、パスワード検証をスキップ
    if (user.password) {
      // パスワードが存在する場合のみ検証する
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ message: 'パスワードが正しくありません' }, { status: 400 });
      }
    }

    // サブスクリプションの確認と削除
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
    });

    // Stripeサブスクリプションがある場合はキャンセル
    if (subscription && subscription.subscriptionId) {
      try {
        const stripe = getStripeInstance();
        await stripe.subscriptions.cancel(subscription.subscriptionId);
        logger.info(`Stripeサブスクリプションをキャンセルしました: ${subscription.subscriptionId}`);
      } catch (stripeError) {
        logger.error('Stripeサブスクリプションキャンセルエラー:', stripeError);
        // エラーはログに残すが処理は続行
      }
    }

    // トランザクションで関連データを削除
    await prisma.$transaction(async (tx) => {
      // カスタムリンクの削除
      await tx.customLink.deleteMany({
        where: { userId: user.id },
      });

      // SNSリンクの削除
      await tx.snsLink.deleteMany({
        where: { userId: user.id },
      });

      // プロフィールの削除
      await tx.profile.deleteMany({
        where: { userId: user.id },
      });

      // サブスクリプションの削除
      await tx.subscription.deleteMany({
        where: { userId: user.id },
      });

      // アカウントの削除
      await tx.account.deleteMany({
        where: { userId: user.id },
      });

      // ユーザーの削除
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    logger.info(`ユーザーアカウントを削除しました: ${user.id}`);
    return NextResponse.json({ message: 'アカウントが正常に削除されました' }, { status: 200 });
  } catch (error) {
    logger.error('アカウント削除エラー:', error);
    return NextResponse.json(
      { message: 'アカウント削除中にエラーが発生しました' },
      { status: 500 },
    );
  }
}