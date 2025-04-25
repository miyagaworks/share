// app/api/corporate/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    // 管理者を変更する場合、新しい管理者を設定する必要がある
    if (params.id === corporateTenant.adminId && role !== 'admin') {
      return NextResponse.json(
        { error: '現在の管理者の役割を変更するには、新しい管理者を先に設定してください' },
        { status: 400 }
      );
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

    // 更新対象のユーザーが同じテナントに所属しているか確認
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser || targetUser.tenantId !== corporateTenant.id) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        corporateRole: role,
        departmentId: departmentId || null,
      },
    });

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

// DELETE ユーザーを削除するAPI
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // 管理者自身を削除しようとしていないか確認
    if (params.id === corporateTenant.adminId) {
      return NextResponse.json(
        { error: '管理者自身を削除することはできません。先に別のユーザーを管理者に設定してください。' },
        { status: 400 }
      );
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
      { status: 500 }
    );
  }
}