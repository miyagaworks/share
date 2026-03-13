// app/api/partner/demo-accounts/[id]/route.ts
// デモアカウントの削除
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: { id: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 403 });
    }

    const { id } = await params;

    // デモユーザーの存在確認（パートナー配下であること + デモフラグ）
    const demoUser = await prisma.user.findFirst({
      where: {
        id,
        isDemo: true,
        OR: [
          { partnerId: partner.id },
          { tenant: { partnerId: partner.id } },
        ],
      },
      select: { id: true, name: true },
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: 'デモアカウントが見つかりません' },
        { status: 404 },
      );
    }

    // プロフィールとユーザーを削除（onDelete: Cascade でプロフィールも消える）
    await prisma.user.delete({
      where: { id: demoUser.id },
    });

    // アクティビティログ
    await prisma.partnerActivityLog.create({
      data: {
        partnerId: partner.id,
        userId: session.user.id,
        action: 'demo_account_deleted',
        entityType: 'User',
        entityId: demoUser.id,
        description: `デモアカウント「${demoUser.name || ''}」を削除しました`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demo account deletion error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
