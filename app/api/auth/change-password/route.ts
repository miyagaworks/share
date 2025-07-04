// app/api/auth/change-password/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
export async function POST(req: Request) {
  try {
    // セッションの確認
    const session = await auth();
    // デバッグ: セッション情報をログ出力
    logger.debug(
      'セッション情報:',
      JSON.stringify(
        {
          id: session?.user?.id,
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image ? '[image exists]' : '[no image]',
        },
        null,
        2,
      ),
    );
    // 未認証の場合はアクセス拒否
    if (!session || !session.user?.email) {
      logger.debug('認証エラー: セッションまたはメールアドレスがありません');
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }
    const userEmail = session.user.email;
    logger.debug(`検索するメールアドレス: ${userEmail}`);
    const { currentPassword, newPassword } = await req.json();
    logger.debug('リクエスト内容:', {
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      newPasswordLength: newPassword?.length,
    });
    // バリデーション
    if (!newPassword) {
      return NextResponse.json({ message: '新しいパスワードが必要です' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ message: '新しいパスワードは8文字以上必要です' }, { status: 400 });
    }
    // データベース内のすべてのユーザーを取得してログ出力（デバッグ用）
    logger.debug('データベース内のユーザーを確認します...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    logger.debug(`総ユーザー数: ${allUsers.length}`);
    logger.debug(
      'ユーザー一覧:',
      allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        emailMatch: u.email?.toLowerCase() === userEmail?.toLowerCase(),
      })),
    );
    // ユーザーの取得 - 大文字小文字を区別せずに検索
    logger.debug(`メールアドレス「${userEmail}」でユーザーを検索中...`);
    const users = await prisma.user.findMany({
      where: {
        email: {
          mode: 'insensitive', // 大文字小文字を区別しない
          equals: userEmail,
        },
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
    logger.debug(`検索結果: ${users.length}件のユーザーが見つかりました`);
    if (users.length === 0) {
      logger.debug('ユーザーが見つかりませんでした');
      return NextResponse.json({ message: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 最初のユーザーを使用
    const user = users[0];
    logger.debug(`ユーザーが見つかりました: ID=${user.id}, Email=${user.email}`);
    // OAuth（ソーシャルログイン）ユーザーの場合（パスワードがnull）
    if (!user.password) {
      logger.debug('OAuthユーザー: 初回パスワード設定');
      // 新しいパスワードを設定（初回パスワード設定として扱う）
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      logger.debug('パスワードが正常に設定されました');
      return NextResponse.json({ message: 'パスワードが正常に設定されました' }, { status: 200 });
    }
    // 通常のユーザーの場合は現在のパスワードを検証
    logger.debug('通常ユーザー: パスワード検証');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      logger.debug('パスワード検証失敗');
      return NextResponse.json({ message: '現在のパスワードが正しくありません' }, { status: 400 });
    }
    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // パスワードを更新
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    logger.debug('パスワードが正常に更新されました');
    return NextResponse.json({ message: 'パスワードが正常に更新されました' }, { status: 200 });
  } catch (error) {
    logger.error('パスワード変更エラー:', error);
    return NextResponse.json(
      { message: 'パスワード変更中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
