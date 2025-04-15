// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RegisterSchema } from '@/schemas/auth';
import bcrypt from 'bcryptjs';
import { generateSlug } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 本番環境のログ出力を制限
    if (process.env.NODE_ENV !== 'production') {
      console.log('受信したリクエストボディ:', {
        name: body.name,
        email: body.email ? `${body.email.substring(0, 3)}...` : undefined, // メールアドレスの一部のみログ出力
        hasPassword: !!body.password,
      });
    }

    const validatedFields = RegisterSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json({ message: '入力内容に問題があります。' }, { status: 400 });
    }

    const { name, email, password } = validatedFields.data;

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

    if (process.env.NODE_ENV !== 'production') {
      console.log('トライアル期間を設定:', {
        開始日: now.toISOString(),
        終了日: trialEndsAt.toISOString(),
        日数: '7日間',
      });
    }

    // ユーザーの作成 - 正規化されたメールアドレスを使用
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail, // 正規化したメールアドレスを保存
        password: hashedPassword,
        mainColor: '#3B82F6',
        trialEndsAt,
        subscriptionStatus: 'trialing',
      },
    });

    // プロフィールの作成
    let slug = generateSlug();
    let slugExists = true;

    // スラグがすでに存在する場合は新しいスラグを生成
    while (slugExists) {
      const existingSlug = await prisma.profile.findUnique({
        where: { slug },
      });

      if (!existingSlug) {
        slugExists = false;
      } else {
        slug = generateSlug();
      }
    }

    await prisma.profile.create({
      data: {
        userId: user.id,
        slug,
        isPublic: true,
      },
    });

    // Subscriptionテーブルに初期レコードを作成
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'trialing',
        plan: 'trial',
        subscriptionId: null, // Stripe連携後に設定
        priceId: null, // Stripe連携後に設定
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt, // トライアル終了日
        trialStart: now, // トライアル開始日を明示的に設定
        trialEnd: trialEndsAt, // トライアル終了日を明示的に設定
        cancelAtPeriodEnd: false,
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`ユーザー登録完了: ID ${user.id}`);
    }

    return NextResponse.json(
      {
        message: 'ユーザーが正常に登録されました。',
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'ユーザー登録中にエラーが発生しました。' },
      { status: 500 },
    );
  }
}