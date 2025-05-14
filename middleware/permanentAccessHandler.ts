// middleware/permanentAccessHandler.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  getVirtualTenantData,
  VirtualTenantData,
  generateVirtualTenantData,
} from '@/lib/corporateAccessState';

// ユーザーデータの型定義
interface UserData {
  id: string;
  name: string | null;
  subscriptionStatus: string | null;
  email: string;
  image: string | null;
}

export async function permanentAccessMiddleware(
  req: NextRequest,
  handler: (
    req: NextRequest,
    isPermanent: boolean,
    userData: UserData,
    virtualData?: VirtualTenantData,
  ) => Promise<NextResponse>,
) {
  try {
    // セッションの取得
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報の取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 型変換して明示的に UserData として扱う
    const userData: UserData = {
      id: user.id,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
      email: user.email,
      image: user.image,
    };

    // 永久利用権ユーザーの場合
    if (user.subscriptionStatus === 'permanent') {
      // 仮想テナントデータを生成
      const virtualData = getVirtualTenantData() || {
        ...generateVirtualTenantData(userData.id, userData.name),
      };

      // 仮想テナントデータを使って処理
      return handler(req, true, userData, virtualData);
    }

    // 通常のユーザーの場合
    return handler(req, false, userData);
  } catch (error) {
    console.error('永久利用権ミドルウェアエラー:', error);
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
  }
}