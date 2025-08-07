// app/api/admin/access/route.ts (修正版 - 財務管理者は閲覧のみ)
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
  canViewCancelRequests: boolean; // 解約申請ページへのアクセス権限
  canProcessCancelRequests: boolean; // 🆕 解約申請の処理権限（承認・却下）
  canExportUserData: boolean; // 🆕 ユーザーデータエクスポート実行権限
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
      canViewCancelRequests: true,
      canProcessCancelRequests: true, // スーパー管理者は処理可能
      canExportUserData: true, // スーパー管理者はエクスポート可能
    };
  } else if (adminLevel === 'financial') {
    // 🔧 財務管理者: 閲覧のみ権限
    return {
      canManageUsers: false,
      canManageSubscriptions: false,
      canManageFinancialAdmins: false,
      canViewFinancialData: true,
      canManageFinancialData: true,
      canManageNotifications: false,
      canManageEmails: false,
      canViewProfiles: true, // 🔧 修正: エクスポートページアクセスのため
      canAccessSystemInfo: false,
      canViewCancelRequests: true, // 🔧 解約申請ページは閲覧可能
      canProcessCancelRequests: false, // 🔧 解約申請の処理は不可
      canExportUserData: false, // 🔧 エクスポート実行は不可
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
      canViewCancelRequests: false,
      canProcessCancelRequests: false,
      canExportUserData: false,
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