// app/api/profile/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報とプロフィール情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        nameEn: true,
        nameKana: true,
        password: true,
        image: true,
        bio: true,
        phone: true,
        company: true,
        companyUrl: true,
        companyLabel: true,
        profile: true,
        // カラー設定フィールドを追加
        mainColor: true,
        snsIconColor: true,
        bioBackgroundColor: true,
        bioTextColor: true,
        // 法人テナントから継承される可能性のあるフィールド
        headerText: true,
        textColor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // センシティブな情報を除外して返す
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { password: _password, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json({ error: 'プロフィール情報の取得に失敗しました' }, { status: 500 });
  }
}