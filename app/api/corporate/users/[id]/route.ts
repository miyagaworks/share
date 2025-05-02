// app/api/corporate/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// ユーザー情報を更新するAPI（役割と部署の変更）
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] /api/corporate/users/${params.id} PATCHリクエスト受信`);

    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[API] リクエスト送信ユーザーID: ${userId}`);
    
    // テナント情報を取得
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });

    if (!corporateTenant) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await request.json();
    const { role, departmentId } = body;
    console.log(`[API] 更新対象ID: ${params.id}, 新しい役割: ${role}, 部署ID: ${departmentId}`);

    // 対象ユーザーの現在の情報を取得
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser || targetUser.tenantId !== corporateTenant.id) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    console.log(`[API] 対象ユーザー情報:`, targetUser);
    console.log(`[API] 対象ユーザーの現在の役割: ${targetUser.corporateRole}`);

    // 管理者の役割を変更する場合のチェック
    if (targetUser.corporateRole === 'admin' && role !== 'admin') {
      console.log('[API] 管理者から他の役割への変更を検証します');
      
      // 他の管理者をカウント
      const otherAdminCount = await prisma.user.count({
        where: {
          tenantId: corporateTenant.id,
          corporateRole: 'admin',
          id: { not: params.id },
        },
      });
      
      console.log(`[API] 他の管理者数: ${otherAdminCount}`);

      // 他の管理者がいない場合、エラー
      if (otherAdminCount === 0) {
        console.log('[API] エラー: 他の管理者がいないため役割変更できません');
        return NextResponse.json(
          {
            error: '少なくとも1人の管理者が必要です。他のユーザーを先に管理者に設定してください',
          },
          { status: 400 },
        );
      }
      
      console.log('[API] 他の管理者が存在するため、役割変更を許可します');
    }

    // 部署IDが指定されている場合、存在チェック
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: {
          id: departmentId,
          tenantId: corporateTenant.id,
        },
      });

      if (!department) {
        return NextResponse.json({ error: '指定された部署が見つかりません' }, { status: 400 });
      }
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        corporateRole: role,
        departmentId: departmentId || null,
      },
    });

    console.log(`[API] ユーザー情報を更新しました: ${updatedUser.id}, 役割: ${updatedUser.corporateRole}`);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        corporateRole: updatedUser.corporateRole,
        departmentId: updatedUser.departmentId,
      },
    });
  } catch (error) {
    console.error(`[API] ユーザー更新エラー:`, error);
    return NextResponse.json(
      {
        error: 'ユーザー情報の更新に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ユーザーを削除するAPI
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log(`[API] /api/corporate/users/${params.id} DELETEリクエスト受信`);

    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;

    // テナント情報を取得
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });

    if (!corporateTenant) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 削除対象のユーザーが同じテナントに所属しているか確認
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser || targetUser.tenantId !== corporateTenant.id) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 対象ユーザーが管理者である場合、他の管理者が存在するか確認
    if (targetUser.corporateRole === 'admin') {
      // 他の管理者をカウント
      const otherAdminCount = await prisma.user.count({
        where: {
          tenantId: corporateTenant.id,
          corporateRole: 'admin',
          id: { not: params.id },
        },
      });

      // 他の管理者がいない場合、エラー
      if (otherAdminCount === 0) {
        return NextResponse.json(
          {
            error: '少なくとも1人の管理者が必要です。他のユーザーを先に管理者に設定してください',
          },
          { status: 400 },
        );
      }
    }

    // ユーザーを削除
    // 関連する認証情報も削除するため、PasswordResetTokenやAccountも削除
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: params.id },
      }),
      prisma.account.deleteMany({
        where: { userId: params.id },
      }),
      prisma.user.delete({
        where: { id: params.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'ユーザーを削除しました',
    });
  } catch (error) {
    console.error(`[API] ユーザー削除エラー:`, error);
    return NextResponse.json(
      {
        error: 'ユーザーの削除に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// 招待メールを再送信するAPI
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log(`[API] /api/corporate/users/${params.id}/resend-invite POSTリクエスト受信`);

    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;

    // テナント情報を取得
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });

    if (!corporateTenant) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 対象ユーザーの情報を取得
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser || targetUser.tenantId !== corporateTenant.id) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 古いトークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: params.id },
    });

    // 新しいトークンを生成
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72時間有効

    // 新しいトークンを作成
    await prisma.passwordResetToken.create({
      data: {
        token,
        expires: expiresAt,
        userId: params.id,
      },
    });

    // 環境変数からベースURLを取得
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // 招待リンクの生成
    const inviteUrl = `${normalizedBaseUrl}/auth/invite?token=${token}`;

    // メール送信
    await sendEmail({
      to: targetUser.email,
      subject: `${corporateTenant.name}からの招待（再送信）`,
      text: `${corporateTenant.name}に招待されました。以下のリンクからアクセスしてください。\n\n${inviteUrl}\n\nこのリンクは72時間有効です。`,
      html: `
        <div>
          <h1>${corporateTenant.name}からの招待（再送信）</h1>
          <p>${corporateTenant.name}に招待されました。以下のリンクからアクセスしてください。</p>
          <p><a href="${inviteUrl}">招待を受け入れる</a></p>
          <p>このリンクは72時間有効です。</p>
        </div>
      `,
    });

    // ユーザー情報を更新
    await prisma.user.update({
      where: { id: params.id },
      data: {
        emailVerified: null, // 未確認状態に設定
      },
    });

    return NextResponse.json({
      success: true,
      message: '招待を再送信しました',
    });
  } catch (error) {
    console.error(`[API] 招待再送信エラー:`, error);
    return NextResponse.json(
      {
        error: '招待の再送信に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// ランダムな招待トークンを生成する関数
function generateInviteToken(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}