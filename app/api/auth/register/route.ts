// app/api/auth/register/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RegisterSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 統合ロガーを使用
    logger.debug('ユーザー登録リクエスト受信', {
      lastName: body.lastName ? 'provided' : 'missing',
      firstName: body.firstName ? 'provided' : 'missing',
      lastNameKana: body.lastNameKana ? 'provided' : 'missing',
      firstNameKana: body.firstNameKana ? 'provided' : 'missing',
      email: body.email ? 'provided' : 'missing',
      password: body.password ? 'provided' : 'missing',
    });

    const validatedFields = RegisterSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json({ message: '入力内容に問題があります。' }, { status: 400 });
    }

    const { lastName, firstName, lastNameKana, firstNameKana, email, password } =
      validatedFields.data;

    // 姓名を結合して完全な名前を作成
    const name = `${lastName} ${firstName}`;

    // フリガナも同様に結合
    const nameKana = `${lastNameKana} ${firstNameKana}`;

    // 英語名は自動生成しない - ユーザーが後で明示的に設定できるようにする
    const nameEn = ''; // 空の文字列を設定

    // メールアドレスを小文字に正規化
    const normalizedEmail = email.toLowerCase();

    // 既存ユーザーのチェック - 大文字小文字を区別せずに検索
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: normalizedEmail,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'このメールアドレスは既に登録されています。' },
        { status: 409 },
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7日間の無料トライアル期間を設定
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    logger.debug('トライアル期間設定', {
      period: '7日間',
    });

    // ユーザーの作成 - 姓名とフリガナを個別に保存
    const user = await prisma.user.create({
      data: {
        name, // 結合した漢字名
        nameEn, // 英語名（空の文字列）
        nameKana, // 結合したフリガナ
        lastName, // 姓（追加）
        firstName, // 名（追加）
        lastNameKana, // 姓のフリガナ（追加）
        firstNameKana, // 名のフリガナ（追加）
        email: normalizedEmail, // 正規化したメールアドレスを保存
        password: hashedPassword,
        mainColor: '#3B82F6',
        trialEndsAt,
        subscriptionStatus: 'trialing',
      },
    });

    logger.debug('ユーザー登録完了', { userId: user.id });

    return NextResponse.json(
      {
        message: 'ユーザーが正常に登録されました。',
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('ユーザー登録エラー:', error);
    return NextResponse.json(
      { message: 'ユーザー登録中にエラーが発生しました。' },
      { status: 500 },
    );
  }
}