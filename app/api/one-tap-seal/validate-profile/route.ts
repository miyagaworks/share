// app/api/one-tap-seal/validate-profile/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isValidProfileSlug } from '@/lib/one-tap-seal/profile-slug-manager';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'スラッグが必要です' }, { status: 400 });
    }

    if (!isValidProfileSlug(slug)) {
      return NextResponse.json({
        isValid: false,
        isAvailable: false,
        message: '英小文字、数字、ハイフンのみ使用できます',
      });
    }

    // Profile.slug の重複チェック
    const existingProfile = await prisma.profile.findUnique({
      where: { slug },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (existingProfile) {
      const isOwn = existingProfile.userId === session.user.id;
      return NextResponse.json({
        isValid: true,
        isAvailable: isOwn, // 自分のプロフィールの場合のみ利用可能
        isOwn,
        message: isOwn ? '使用可能です（自分のプロフィール）' : '他のユーザーが使用中です',
        profileUrl: `https://app.sns-share.com/${slug}`,
      });
    }

    return NextResponse.json({
      isValid: false,
      isAvailable: false,
      message: 'プロフィールが見つかりません',
    });
  } catch (error) {
    console.error('プロフィールスラッグ検証エラー:', error);
    return NextResponse.json({ error: '検証に失敗しました' }, { status: 500 });
  }
}