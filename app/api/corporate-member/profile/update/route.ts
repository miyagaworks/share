// app/api/corporate-member/profile/update/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  checkPermanentAccess,
  updateVirtualTenantData,
  getVirtualTenantData,
} from '@/lib/corporateAccess';
import { logCorporateActivity } from '@/lib/utils/activity-logger';

// バリデーションスキーマ - 姓名を個別に管理するフィールドを追加
const ProfileUpdateSchema = z.object({
  // 姓名関連フィールド
  name: z.string().optional(),
  lastName: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  nameKana: z.string().optional().nullable(),
  lastNameKana: z.string().optional().nullable(),
  firstNameKana: z.string().optional().nullable(),

  // その他のフィールド
  bio: z.string().max(300, '自己紹介は300文字以内で入力してください').optional().nullable(),
  image: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().max(50, '役職は50文字以内で入力してください').optional().nullable(),
  headerText: z
    .string()
    .max(50, 'ヘッダーテキストは50文字以内で入力してください')
    .optional()
    .nullable(),
  textColor: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();

    // データの検証
    const validationResult = ProfileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json({ error: '入力データが無効です', details: errors }, { status: 400 });
    }

    // 永久利用権ユーザーかどうかをチェック
    const isPermanent = checkPermanentAccess();

    if (isPermanent) {
      console.log('永久利用権ユーザーのプロフィール更新:', session.user.id);

      const data = validationResult.data;

      // 通常のデータベース更新処理
      // ユーザー情報を更新
      const updateData: Record<string, unknown> = {
        nameEn: data.nameEn,
        bio: data.bio,
        phone: data.phone,
        position: data.position,
        image: data.image,
        headerText: data.headerText,
        textColor: data.textColor,
      };

      // 姓名フィールドの処理
      if (data.lastName || data.firstName) {
        updateData.lastName = data.lastName;
        updateData.firstName = data.firstName;
        // name フィールドも更新
        const fullName = `${data.lastName || ''} ${data.firstName || ''}`.trim();
        if (fullName) {
          updateData.name = fullName;
        }
      } else if (data.name) {
        updateData.name = data.name;
      }

      // フリガナフィールドの処理
      if (data.lastNameKana || data.firstNameKana) {
        updateData.lastNameKana = data.lastNameKana;
        updateData.firstNameKana = data.firstNameKana;
        // nameKana フィールドも更新
        const fullNameKana = `${data.lastNameKana || ''} ${data.firstNameKana || ''}`.trim();
        if (fullNameKana) {
          updateData.nameKana = fullNameKana;
        }
      } else if (data.nameKana) {
        updateData.nameKana = data.nameKana;
      }

      // ユーザー情報を更新
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });

      // プロフィールが存在しない場合は作成
      let profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
      });

      if (!profile) {
        // スラッグを生成
        const slug = `${session.user.id.substring(0, 8)}`;

        profile = await prisma.profile.create({
          data: {
            userId: session.user.id,
            slug,
            isPublic: true,
          },
        });
      }

      // 仮想テナントデータの更新処理
      const virtualData = getVirtualTenantData();
      if (virtualData) {
        // ユーザー名を仮想テナントデータに反映
        updateVirtualTenantData((data) => {
          // ユーザー情報を更新
          const updatedUsers = data.users.map((user) => {
            if (user.id === session.user.id) {
              return {
                ...user,
                name: updatedUser.name || user.name,
              };
            }
            return user;
          });

          return {
            ...data,
            users: updatedUsers,
          };
        });
      }

      // センシティブ情報を除外
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = updatedUser;

      return NextResponse.json({
        success: true,
        user: safeUser,
        profile,
        isPermanentUser: true,
      });
    }

    // 通常ユーザーの場合（永久利用権でない場合）の処理
    // ユーザー情報とテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenant: true,
        adminOfTenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // ユーザーが法人テナントに所属しているか確認
    const tenantInfo = user.tenant || user.adminOfTenant;
    if (!tenantInfo) {
      return NextResponse.json({ error: '法人テナントに所属していません' }, { status: 403 });
    }

    const data = validationResult.data;

    // 更新データを準備
    const updateData: Record<string, unknown> = {
      nameEn: data.nameEn,
      bio: data.bio,
      phone: data.phone,
      position: data.position,
      image: data.image,
      headerText: data.headerText,
      textColor: data.textColor,
    };

    // 姓名フィールドの処理
    if (data.lastName || data.firstName) {
      updateData.lastName = data.lastName;
      updateData.firstName = data.firstName;
      // name フィールドも更新
      const fullName = `${data.lastName || ''} ${data.firstName || ''}`.trim();
      if (fullName) {
        updateData.name = fullName;
      }
    } else if (data.name) {
      updateData.name = data.name;
    }

    // フリガナフィールドの処理
    if (data.lastNameKana || data.firstNameKana) {
      updateData.lastNameKana = data.lastNameKana;
      updateData.firstNameKana = data.firstNameKana;
      // nameKana フィールドも更新
      const fullNameKana = `${data.lastNameKana || ''} ${data.firstNameKana || ''}`.trim();
      if (fullNameKana) {
        updateData.nameKana = fullNameKana;
      }
    } else if (data.nameKana) {
      updateData.nameKana = data.nameKana;
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // プロフィールが存在しない場合は作成
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      // スラッグを生成
      const slug = `${session.user.id.substring(0, 8)}`;

      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          slug,
          isPublic: true,
        },
      });
    }

    // アクティビティログを記録（テナントIDが存在する場合のみ）
    if (tenantInfo.id) {
      try {
        await logCorporateActivity({
          tenantId: tenantInfo.id,
          userId: session.user.id,
          action: 'update_user',
          entityType: 'user',
          entityId: session.user.id,
          description: `${updatedUser.name || 'ユーザー'}がプロフィールを更新しました`,
          metadata: {
            fields: Object.keys(updateData),
          },
        });
      } catch (logError) {
        console.error('アクティビティログ記録エラー:', logError);
        // ログエラーは処理を続行
      }
    }

    // センシティブ情報を除外
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
      profile,
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
  }
}