// app/api/profile/share/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// バリデーションスキーマ
const ShareSettingsSchema = z.object({
  isPublic: z.boolean().optional(),
  slug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'URLスラッグは英数字、ハイフン、アンダースコアのみ使用可能です',
    })
    .optional(),
});
// GET: ユーザーの共有設定を取得
export async function GET() {
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
        name: true,
        image: true,
        profile: {
          select: {
            id: true,
            slug: true,
            isPublic: true,
            views: true,
            lastAccessed: true,
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // プロフィールがない場合
    if (!user.profile) {
      return NextResponse.json({
        success: true,
        shareSettings: {
          isPublic: false,
          slug: null,
          views: 0,
          lastAccessed: null,
        },
        hasProfile: false,
      });
    }
    return NextResponse.json({
      success: true,
      shareSettings: {
        isPublic: user.profile.isPublic,
        slug: user.profile.slug,
        views: user.profile.views,
        lastAccessed: user.profile.lastAccessed,
      },
      hasProfile: true,
    });
  } catch (error) {
    logger.error('共有設定取得エラー:', error);
    return NextResponse.json({ error: '共有設定の取得に失敗しました' }, { status: 500 });
  }
}
// POST: ユーザーの共有設定を更新
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // リクエストボディの取得
    const body = await req.json();
    // データの検証
    const validationResult = ShareSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json({ error: '入力データが無効です', details: errors }, { status: 400 });
    }
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    const data = validationResult.data;
    // プロフィールの作成または更新
    let profile;
    if (!user.profile) {
      // スラッグの指定がない場合はデフォルトのスラッグを生成
      const slug = data.slug || `user-${session.user.id.substring(0, 8)}`;
      // スラッグが既に使用されているか確認
      if (data.slug) {
        const existingProfile = await prisma.profile.findFirst({
          where: {
            slug: data.slug,
          },
        });
        if (existingProfile) {
          return NextResponse.json(
            { error: '指定されたURLスラッグは既に使用されています' },
            { status: 400 },
          );
        }
      }
      // プロフィールの作成
      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          slug,
          isPublic: data.isPublic ?? true,
        },
      });
    } else {
      // 更新データを準備
      const updateData: Record<string, unknown> = {};
      if (data.isPublic !== undefined) {
        updateData.isPublic = data.isPublic;
      }
      if (data.slug) {
        // スラッグが既に使用されているか確認（自分のプロフィール以外）
        const existingProfile = await prisma.profile.findFirst({
          where: {
            slug: data.slug,
            userId: { not: session.user.id },
          },
        });
        if (existingProfile) {
          return NextResponse.json(
            { error: '指定されたURLスラッグは既に使用されています' },
            { status: 400 },
          );
        }
        updateData.slug = data.slug;
      }
      // プロフィールの更新
      profile = await prisma.profile.update({
        where: { userId: session.user.id },
        data: updateData,
      });
    }
    return NextResponse.json({
      success: true,
      shareSettings: {
        isPublic: profile.isPublic,
        slug: profile.slug,
        views: profile.views,
        lastAccessed: profile.lastAccessed,
      },
    });
  } catch (error) {
    logger.error('共有設定更新エラー:', error);
    return NextResponse.json({ error: '共有設定の更新に失敗しました' }, { status: 500 });
  }
}