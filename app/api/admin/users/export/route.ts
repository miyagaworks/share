// app/api/admin/access/route.ts (修正版 - 財務管理者にエクスポート権限付与)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { getAdminLevel, getAdminInfo } from '@/lib/utils/admin-access-server';

// 管理者権限の定義
interface AdminPermissions {
  canManageUsers: boolean;
  canManageSubscriptions: boolean;
  canManageFinancialAdmins: boolean;
  canViewFinancialData: boolean;
  canManageFinancialData: boolean;
  canManageNotifications: boolean;
  canManageEmails: boolean;
  canViewProfiles: boolean;
  canAccessSystemInfo: boolean;
  canExportUserData: boolean; // 🆕 追加: ユーザーデータエクスポート権限
  canViewCancelRequests: boolean; // 🆕 追加: 解約申請閲覧権限
}

// 管理者レベルから権限を生成する関数
function generatePermissions(adminLevel: 'super' | 'financial' | 'none'): AdminPermissions {
  if (adminLevel === 'super') {
    // スーパー管理者: 全権限
    return {
      canManageUsers: true,
      canManageSubscriptions: true,
      canManageFinancialAdmins: true,
      canViewFinancialData: true,
      canManageFinancialData: true,
      canManageNotifications: true,
      canManageEmails: true,
      canViewProfiles: true,
      canAccessSystemInfo: true,
      canExportUserData: true, // 🆕 スーパー管理者はエクスポート可能
      canViewCancelRequests: true, // 🆕 スーパー管理者は解約申請管理可能
    };
  } else if (adminLevel === 'financial') {
    // 🔧 修正: 財務管理者に必要な権限を追加
    return {
      canManageUsers: false,
      canManageSubscriptions: false, // 閲覧のみ（管理は不可）
      canManageFinancialAdmins: false,
      canViewFinancialData: true,
      canManageFinancialData: true,
      canManageNotifications: false,
      canManageEmails: false,
      canViewProfiles: true, // 🔧 修正: 財務管理者はプロフィール閲覧可能
      canAccessSystemInfo: false,
      canExportUserData: true, // 🆕 財務管理者はユーザーデータエクスポート可能
      canViewCancelRequests: true, // 🆕 財務管理者は解約申請閲覧・管理可能
    };
  } else {
    // 一般ユーザー: 権限なし
    return {
      canManageUsers: false,
      canManageSubscriptions: false,
      canManageFinancialAdmins: false,
      canViewFinancialData: false,
      canManageFinancialData: false,
      canManageNotifications: false,
      canManageEmails: false,
      canViewProfiles: false,
      canAccessSystemInfo: false,
      canExportUserData: false,
      canViewCancelRequests: false,
    };
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          isSuperAdmin: false,
          isFinancialAdmin: false,
          adminLevel: 'none',
          permissions: generatePermissions('none'),
          error: '認証されていません',
        },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // 管理者レベルを取得
    const adminLevel = await getAdminLevel(userId);
    const adminInfo = await getAdminInfo(userId);

    // 権限オブジェクトを生成
    const permissions = generatePermissions(adminLevel);

    logger.debug('管理者チェック結果:', {
      userId,
      email: session.user.email,
      adminLevel,
      isSuperAdmin: adminInfo.isSuperAdmin,
      isFinancialAdmin: adminInfo.isFinancialAdmin,
      permissions,
    });

    // 管理者権限がない場合
    if (adminLevel === 'none') {
      return NextResponse.json({
        isSuperAdmin: false,
        isFinancialAdmin: false,
        adminLevel: 'none',
        permissions: generatePermissions('none'),
        userId,
        email: session.user.email,
        message: '管理者権限がありません',
      });
    }

    // 管理者権限がある場合
    return NextResponse.json({
      isSuperAdmin: adminInfo.isSuperAdmin,
      isFinancialAdmin: adminInfo.isFinancialAdmin,
      adminLevel,
      permissions,
      userId,
      email: session.user.email,
      userType: adminInfo.userType,
      message: '管理者権限が確認されました',
    });
  } catch (error) {
    logger.error('管理者アクセスチェックエラー:', error);
    return NextResponse.json(
      {
        isSuperAdmin: false,
        isFinancialAdmin: false,
        adminLevel: 'none',
        permissions: generatePermissions('none'),
        error: '管理者アクセスチェック中にエラーが発生しました',
      },
      { status: 500 },
    );
  }
}