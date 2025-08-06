// types/financial-admin.ts
export interface FinancialAdmin {
  id: string;
  userId: string;
  addedBy: string;
  addedAt: Date;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // リレーション
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };

  addedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
  userId: string;
  email: string;
  message: string;
  permissions: AdminPermissions;
}

export interface AdminPermissions {
  canManageUsers: boolean; // ユーザー管理：スーパー管理者のみ
  canManageSubscriptions: boolean; // サブスクリプション管理：スーパー管理者のみ
  canManageFinancialAdmins: boolean; // 財務管理者管理：スーパー管理者のみ
  canViewFinancialData: boolean; // 財務データ閲覧：両方
  canManageFinancialData: boolean; // 財務データ管理：両方
  canManageNotifications: boolean; // お知らせ管理：スーパー管理者のみ
  canManageEmails: boolean; // メール配信：スーパー管理者のみ
  canViewProfiles: boolean; // プロフィール管理：スーパー管理者のみ
  canAccessSystemInfo: boolean; // システム情報：スーパー管理者のみ
}

export interface FinancialAdminResponse {
  success: boolean;
  data?: FinancialAdmin[];
  message?: string;
  error?: string;
}

export interface AddFinancialAdminRequest {
  userId: string;
  notes?: string;
}

export interface RemoveFinancialAdminRequest {
  userId: string;
}

// 拡張されたダッシュボード情報型定義
export interface ExtendedDashboardInfo {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    subscriptionStatus: string | null;
  };
  permissions: {
    userType:
      | 'admin'
      | 'corporate'
      | 'personal'
      | 'permanent'
      | 'invited-member'
      | 'financial-admin';
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isFinancialAdmin: boolean; // 🆕 財務管理者フラグ
    hasCorpAccess: boolean;
    isCorpAdmin: boolean;
    isPermanentUser: boolean;
    permanentPlanType: string | null;
    userRole: 'admin' | 'member' | 'personal' | 'financial-admin' | null;
    hasActivePlan: boolean;
    isTrialPeriod: boolean;
    planType: 'personal' | 'corporate' | 'permanent' | null;
    planDisplayName: string;
  };
  navigation: {
    shouldRedirect: boolean;
    redirectPath: string | null;
    menuItems: Array<{
      title: string;
      href: string;
      icon: string;
      isDivider?: boolean;
    }>;
  };
  tenant: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  } | null;
}