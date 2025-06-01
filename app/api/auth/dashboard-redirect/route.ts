// app/api/auth/dashboard-redirect/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    // 管理者ユーザーの場合は管理者ダッシュボードへ
    if (session.user.email === 'admin@sns-share.com') {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    }
    // ユーザーのプロフィールを取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        profile: true,
        subscriptionStatus: true,
      },
    });
    // ユーザーが見つからない場合
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    // ここが問題の原因: プロフィールが存在しなくても常にダッシュボードを表示するように修正
    // if (!user.profile) {
    //   logger.debug('プロフィールが未設定のため/dashboard/profileへリダイレクト');
    //   return NextResponse.redirect(new URL('/dashboard/profile', req.url));
    // }
    // 常にダッシュボードを表示
    return NextResponse.next();
  } catch (error) {
    logger.error('ダッシュボードリダイレクトAPI エラー:', error);
    // エラー時は通常通りダッシュボードを表示
    return NextResponse.next();
  }
}