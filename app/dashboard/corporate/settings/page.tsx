// app/dashboard/corporate/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import {
  HiOfficeBuilding,
  HiCog,
  HiLockClosed,
  HiMail,
  HiInformationCircle,
  HiExclamation,
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { getPlanNameFromId } from '@/lib/stripe';
// 型定義
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number;
}
interface EmailNotifications {
  userAdded: boolean;
  userRemoved: boolean;
  planChanges: boolean;
  securityAlerts: boolean;
  weeklyReports: boolean;
}
// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  maxUsers: number;
  createdAt: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  securitySettings?: {
    passwordPolicy?: PasswordPolicy;
  };
  notificationSettings?: {
    email?: EmailNotifications;
    adminEmail?: string; // ← adminEmail プロパティを追加
  };
  billingAddress?: {
    address: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billingEmail?: string;
  billingContact?: string;
  accountStatus?: string;
}
interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
}
// 設定タブの型定義
type SettingsTab = 'general' | 'security' | 'notifications' | 'billing' | 'advanced';
export default function CorporateSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  // フォーム状態
  const [companyName, setCompanyName] = useState('');
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState({
    userAdded: true,
    userRemoved: true,
    planChanges: true,
    securityAlerts: true,
    weeklyReports: false,
  });
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90,
  });
  const [isSaving, setIsSaving] = useState(false);
  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;
      try {
        setIsLoading(true);
        // まず設定情報を直接取得してみる
        const settingsResponse = await fetch('/api/corporate/settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          // 模擬テナントデータを作成
          const defaultTenant = {
            id: 'temp-id',
            name: settingsData.settings.name || '会社社名を変更ください...',
            maxUsers: 10,
            createdAt: new Date().toISOString(),
            logoUrl: null,
            primaryColor: null,
            secondaryColor: null,
            securitySettings: settingsData.settings.securitySettings,
            notificationSettings: settingsData.settings.notificationSettings,
            billingAddress: settingsData.settings.billingAddress,
            billingEmail: settingsData.settings.billingEmail,
            billingContact: settingsData.settings.billingContact,
            accountStatus: settingsData.settings.accountStatus,
          };
          setTenantData(defaultTenant);
          setIsAdmin(settingsData.isAdmin);
          // フォーム初期値を設定
          setCompanyName(defaultTenant.name);
          // passwordPolicyの初期値を設定
          if (defaultTenant.securitySettings?.passwordPolicy) {
            setPasswordPolicy(defaultTenant.securitySettings.passwordPolicy);
          }
          // フォーム初期値を設定
          if (defaultTenant.notificationSettings?.adminEmail) {
            setAdminEmail(defaultTenant.notificationSettings.adminEmail);
          }
          if (defaultTenant.notificationSettings?.email) {
            setEmailNotifications(defaultTenant.notificationSettings.email);
          }
          if (defaultTenant.billingContact) {
            setBillingName(defaultTenant.billingContact);
          }
          if (defaultTenant.billingEmail) {
            setBillingEmail(defaultTenant.billingEmail);
          }
          if (defaultTenant.billingAddress) {
            setBillingAddress(defaultTenant.billingAddress.address || '');
          }
          setError(null);
        } else {
          // 設定APIが失敗した場合は元の処理を試みる
          try {
            const response = await fetch('/api/corporate/tenant');
            if (!response.ok) {
              throw new Error('テナント情報の取得に失敗しました');
            }
            const responseData = await response.json();
            setTenantData(responseData.tenant);
            setIsAdmin(responseData.userRole === 'admin');
          } catch {
            throw new Error('テナント情報を読み込めませんでした');
          }
        }
        // サブスクリプション情報を取得（エラーが発生しても致命的ではない）
        try {
          const subResponse = await fetch('/api/subscription');
          if (subResponse.ok) {
            const subData = await subResponse.json();
            if (subData.subscription) {
              setSubscriptionData(subData.subscription);
            }
          }
        } catch {
          // サブスクリプション情報の取得失敗は致命的エラーではないのでスルー
        }
      } catch {
        setError('テナント情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenantData();
  }, [session]);
  // 設定を保存
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('会社名を入力してください');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/corporate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          type: 'general',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          setIsAdmin(false);
          throw new Error(data.error || '管理者権限がありません');
        }
        throw new Error(data.error || '設定の更新に失敗しました');
      }

      const responseData = await response.json();

      // 🔥 永久利用権ユーザーのキャッシュクリア処理を強化
      if (responseData.requiresCacheClear || responseData.isPermanentUser) {
        // 1. LocalStorage の仮想テナントキャッシュをクリア
        if (typeof window !== 'undefined') {
          localStorage.removeItem('virtualTenantData');
          localStorage.removeItem('corporateAccessState');
          sessionStorage.removeItem('corporateAccessState');
          sessionStorage.removeItem('userData');
        }

        // 2. React Query のすべてのテナント関連キャッシュを無効化
        await queryClient.invalidateQueries({ queryKey: ['tenant'] });
        await queryClient.removeQueries({ queryKey: ['tenant'] });

        // 3. 仮想テナント更新イベントを発行
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('virtualTenantUpdated', {
              detail: { name: companyName },
            }),
          );

          // 4. カスタムイベントでダッシュボード更新を通知
          window.dispatchEvent(
            new CustomEvent('tenantNameUpdated', {
              detail: { newName: companyName },
            }),
          );
        }

        toast.success('基本設定を保存しました');

        // 5. 少し待ってからページをリロード（確実にキャッシュクリア）
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        return; // ここで処理を終了
      }

      // 通常の処理
      if (responseData.isAdmin !== undefined) {
        setIsAdmin(responseData.isAdmin);
      }

      if (tenantData && responseData.tenant) {
        setTenantData({
          ...tenantData,
          name: responseData.tenant.name || tenantData.name,
        });
      }

      toast.success('基本設定を保存しました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  // パスワードポリシーを保存
  const handleSaveSecuritySettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/corporate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securitySettings: {
            passwordPolicy: passwordPolicy,
          },
          type: 'security',
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'セキュリティ設定の更新に失敗しました');
      }
      // テナントデータを更新
      if (tenantData) {
        setTenantData({
          ...tenantData,
          securitySettings: {
            passwordPolicy: passwordPolicy,
          },
        });
      }
      toast.success('セキュリティ設定を保存しました');
    } catch {
      toast.error('セキュリティ設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  // handleSaveAdvancedSettings関数を更新
  const handleSaveAdvancedSettings = async (action: string) => {
    try {
      setIsSaving(true);
      // action に応じた処理を実装
      let endpoint = '';
      let actionText = '';
      switch (action) {
        case 'export':
          endpoint = '/api/corporate/settings/export';
          actionText = 'データをエクスポート';
          break;
        case 'suspend':
          endpoint = '/api/corporate/settings/suspend';
          actionText = 'アカウントを一時停止';
          break;
        case 'reactivate':
          endpoint = '/api/corporate/settings/reactivate';
          actionText = 'アカウントを再アクティブ化';
          break;
        case 'delete':
          // 確認ダイアログを追加
          if (
            !confirm('法人アカウントを完全に削除してもよろしいですか？この操作は取り消せません。')
          ) {
            setIsSaving(false);
            return;
          }
          endpoint = '/api/corporate/settings/delete';
          actionText = 'アカウントを削除';
          break;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantData?.id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `${actionText}に失敗しました`);
      }
      const data = await response.json();
      toast.success(`${actionText}しました`);
      // データエクスポートの場合、ダウンロード処理を行う
      if (action === 'export' && data.data) {
        handleExportDownload(data.data);
      }
      // アカウント削除の場合はダッシュボードにリダイレクト
      if (action === 'delete' && data.redirectTo) {
        router.push(data.redirectTo);
      }
      // 停止/再開の場合はテナント情報を更新
      if ((action === 'suspend' || action === 'reactivate') && tenantData) {
        setTenantData({
          ...tenantData,
          accountStatus: data.status,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  // エクスポートデータの型定義
  interface ExportData {
    companyName: string;
    exportDate: string;
    users: Array<Record<string, unknown>>;
    departments: Array<Record<string, unknown>>;
    profiles: Array<Record<string, unknown>>;
    usersCSV: string;
    departmentsCSV: string;
    profilesCSV: string;
  }
  // データエクスポートのダウンロード処理関数を追加
  const handleExportDownload = (exportData: ExportData) => {
    try {
      // ファイル名に日時を含める
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const companyName = exportData.companyName.replace(/\s+/g, '_');
      // ユーザーデータのダウンロード
      if (exportData.usersCSV) {
        const usersBlob = new Blob([exportData.usersCSV], { type: 'text/csv;charset=utf-8;' });
        const usersUrl = URL.createObjectURL(usersBlob);
        const usersLink = document.createElement('a');
        usersLink.href = usersUrl;
        usersLink.setAttribute('download', `${companyName}_users_${timestamp}.csv`);
        document.body.appendChild(usersLink);
        usersLink.click();
        document.body.removeChild(usersLink);
      }
      // 部署データのダウンロード
      if (exportData.departmentsCSV) {
        const deptBlob = new Blob([exportData.departmentsCSV], { type: 'text/csv;charset=utf-8;' });
        const deptUrl = URL.createObjectURL(deptBlob);
        const deptLink = document.createElement('a');
        deptLink.href = deptUrl;
        deptLink.setAttribute('download', `${companyName}_departments_${timestamp}.csv`);
        document.body.appendChild(deptLink);
        deptLink.click();
        document.body.removeChild(deptLink);
      }
      // プロフィールデータのダウンロード
      if (exportData.profilesCSV) {
        const profileBlob = new Blob([exportData.profilesCSV], { type: 'text/csv;charset=utf-8;' });
        const profileUrl = URL.createObjectURL(profileBlob);
        const profileLink = document.createElement('a');
        profileLink.href = profileUrl;
        profileLink.setAttribute('download', `${companyName}_profiles_${timestamp}.csv`);
        document.body.appendChild(profileLink);
        profileLink.click();
        document.body.removeChild(profileLink);
      }
      // すべてのデータをJSONとしてダウンロード（オプション）
      const allDataBlob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const allDataUrl = URL.createObjectURL(allDataBlob);
      const allDataLink = document.createElement('a');
      allDataLink.href = allDataUrl;
      allDataLink.setAttribute('download', `${companyName}_all_data_${timestamp}.json`);
      document.body.appendChild(allDataLink);
      allDataLink.click();
      document.body.removeChild(allDataLink);
    } catch {
      toast.error('データのダウンロードに失敗しました');
    }
  };
  // 通知設定を保存
  const handleSaveNotificationSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/corporate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationSettings: {
            email: emailNotifications,
            adminEmail: adminEmail,
          },
          type: 'notifications',
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '通知設定の更新に失敗しました');
      }
      // テナントデータを更新
      if (tenantData) {
        setTenantData({
          ...tenantData,
          notificationSettings: {
            ...tenantData.notificationSettings, // 既存の設定を保持
            email: emailNotifications,
            adminEmail: adminEmail,
          },
        });
      }
      toast.success('通知設定を保存しました');
    } catch {
      toast.error('通知設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  // 請求情報を保存
  const handleSaveBillingSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/corporate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingContact: billingName,
          billingEmail: billingEmail,
          billingAddress: {
            address: billingAddress,
          },
          type: 'billing',
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '請求情報の更新に失敗しました');
      }
      // テナントデータを更新
      if (tenantData) {
        setTenantData({
          ...tenantData,
          billingContact: billingName,
          billingEmail: billingEmail,
          billingAddress: {
            address: billingAddress,
          },
        });
      }
      toast.success('請求情報を保存しました');
    } catch {
      toast.error('請求情報の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  // 読み込み中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }
  // エラー表示
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
        <p className="text-red-700">{error}</p>
        <Button
          variant="corporateOutline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          再読み込み
        </Button>
      </div>
    );
  }
  // テナントデータがない場合
  if (!tenantData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">法人プランが有効ではありません</h3>
        <p className="text-yellow-700">法人プランにアップグレードしてこの機能をご利用ください。</p>
        <Button
          variant="corporate"
          className="mt-4"
          onClick={() => router.push('/dashboard/subscription')}
        >
          プランを見る
        </Button>
      </div>
    );
  }
  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  // プラン名の取得
  const getPlanName = (plan: string, interval?: string) => {
    return getPlanNameFromId(plan, interval);
  };
  // 各設定タブのレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <HiOfficeBuilding className="h-6 w-6 text-corporate-primary mr-2" />
              <h2 className="text-lg font-medium">基本設定</h2>
            </div>
            <form onSubmit={handleSaveSettings}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    会社名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="例: 株式会社 共有商事"
                    disabled={!isAdmin}
                  />
                </div>
                {!isAdmin && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-700">設定の変更には管理者権限が必要です</p>
                  </div>
                )}
                {isAdmin && (
                  <div className="flex justify-end">
                    <Button variant="corporate" type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          保存中...
                        </>
                      ) : (
                        '変更を保存'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <HiLockClosed className="h-6 w-6 text-corporate-primary mr-2" />
              <h2 className="text-lg font-medium">セキュリティ設定</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">パスワードポリシー</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">最小文字数</label>
                    <select
                      value={passwordPolicy.minLength}
                      onChange={(e) =>
                        setPasswordPolicy({ ...passwordPolicy, minLength: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={!isAdmin}
                    >
                      <option value={6}>6文字</option>
                      <option value={8}>8文字</option>
                      <option value={10}>10文字</option>
                      <option value={12}>12文字</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireUppercase"
                      checked={passwordPolicy.requireUppercase}
                      onChange={(e) =>
                        setPasswordPolicy({ ...passwordPolicy, requireUppercase: e.target.checked })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                      disabled={!isAdmin}
                    />
                    <label htmlFor="requireUppercase" className="ml-2 text-sm text-gray-700">
                      大文字を含める必要あり
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireNumbers"
                      checked={passwordPolicy.requireNumbers}
                      onChange={(e) =>
                        setPasswordPolicy({ ...passwordPolicy, requireNumbers: e.target.checked })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                      disabled={!isAdmin}
                    />
                    <label htmlFor="requireNumbers" className="ml-2 text-sm text-gray-700">
                      数字を含める必要あり
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireSpecialChars"
                      checked={passwordPolicy.requireSpecialChars}
                      onChange={(e) =>
                        setPasswordPolicy({
                          ...passwordPolicy,
                          requireSpecialChars: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                      disabled={!isAdmin}
                    />
                    <label htmlFor="requireSpecialChars" className="ml-2 text-sm text-gray-700">
                      特殊文字を含める必要あり
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">パスワード有効期限</label>
                    <select
                      value={passwordPolicy.expiryDays}
                      onChange={(e) =>
                        setPasswordPolicy({ ...passwordPolicy, expiryDays: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={!isAdmin}
                    >
                      <option value={0}>無期限</option>
                      <option value={30}>30日</option>
                      <option value={60}>60日</option>
                      <option value={90}>90日</option>
                      <option value={180}>180日</option>
                    </select>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end">
                  <Button
                    variant="corporate"
                    onClick={handleSaveSecuritySettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        保存中...
                      </>
                    ) : (
                      '設定を保存'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <HiMail className="h-6 w-6 text-corporate-primary mr-2" />
              <h2 className="text-lg font-medium">通知設定</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3">メール通知</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="userAdded"
                      checked={emailNotifications.userAdded}
                      onChange={(e) =>
                        setEmailNotifications({
                          ...emailNotifications,
                          userAdded: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                    />
                    <label htmlFor="userAdded" className="ml-2 text-sm text-gray-700">
                      新しいユーザーが追加された時
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="userRemoved"
                      checked={emailNotifications.userRemoved}
                      onChange={(e) =>
                        setEmailNotifications({
                          ...emailNotifications,
                          userRemoved: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                    />
                    <label htmlFor="userRemoved" className="ml-2 text-sm text-gray-700">
                      ユーザーが削除された時
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="planChanges"
                      checked={emailNotifications.planChanges}
                      onChange={(e) =>
                        setEmailNotifications({
                          ...emailNotifications,
                          planChanges: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                    />
                    <label htmlFor="planChanges" className="ml-2 text-sm text-gray-700">
                      プラン変更時
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="securityAlerts"
                      checked={emailNotifications.securityAlerts}
                      onChange={(e) =>
                        setEmailNotifications({
                          ...emailNotifications,
                          securityAlerts: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                    />
                    <label htmlFor="securityAlerts" className="ml-2 text-sm text-gray-700">
                      セキュリティアラート
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="weeklyReports"
                      checked={emailNotifications.weeklyReports}
                      onChange={(e) =>
                        setEmailNotifications({
                          ...emailNotifications,
                          weeklyReports: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-corporate-primary rounded focus:ring-corporate-primary"
                    />
                    <label htmlFor="weeklyReports" className="ml-2 text-sm text-gray-700">
                      週次利用レポート
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">管理者通知メールアドレス</h3>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="admin@company.com"
                    className="w-full"
                    disabled={!isAdmin}
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    システム通知やアラートを受け取るメールアドレスを設定します。複数のアドレスはカンマで区切ってください。
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="corporate"
                  onClick={handleSaveNotificationSettings}
                  disabled={isSaving || !isAdmin}
                >
                  {isSaving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      保存中...
                    </>
                  ) : (
                    '設定を保存'
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <HiCog className="h-6 w-6 text-corporate-primary mr-2" />
              <h2 className="text-lg font-medium">請求情報</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3">現在のプラン</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">プラン</span>
                  <span className="font-medium">
                    {subscriptionData ? getPlanName(subscriptionData.plan) : 'スタータープラン'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">ステータス</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    アクティブ
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">次回更新日</span>
                  <span className="font-medium">
                    {subscriptionData
                      ? formatDate(subscriptionData.currentPeriodEnd)
                      : formatDate(new Date().toISOString())}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">ユーザー数</span>
                  <span className="font-medium">{tenantData.maxUsers}名まで</span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="corporateOutline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/subscription')}
                >
                  プランを管理
                </Button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3">請求先情報</h3>
              <form className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">会社名</label>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => isAdmin && setCompanyName(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">担当者名</label>
                  <Input
                    type="text"
                    placeholder="山田 太郎"
                    value={billingName}
                    onChange={(e) => isAdmin && setBillingName(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">メールアドレス</label>
                  <Input
                    type="email"
                    placeholder="billing@company.com"
                    value={billingEmail}
                    onChange={(e) => isAdmin && setBillingEmail(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">住所</label>
                  <Input
                    type="text"
                    placeholder="東京都千代田区..."
                    value={billingAddress}
                    onChange={(e) => isAdmin && setBillingAddress(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                {isAdmin && (
                  <div className="flex justify-end">
                    <Button
                      variant="corporate"
                      onClick={handleSaveBillingSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          保存中...
                        </>
                      ) : (
                        '情報を更新'
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        );
      // renderTabContent関数内の詳細設定タブ部分を更新
      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <HiCog className="h-6 w-6 text-corporate-primary mr-2" />
              <h2 className="text-lg font-medium">詳細設定</h2>
            </div>
            {/* アカウントステータス表示 */}
            {tenantData.accountStatus && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-2">現在のアカウント状態</h3>
                <div className="flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tenantData.accountStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : tenantData.accountStatus === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tenantData.accountStatus === 'active'
                      ? 'アクティブ'
                      : tenantData.accountStatus === 'suspended'
                        ? '一時停止中'
                        : tenantData.accountStatus}
                  </span>
                  {/* 一時停止中の場合は再開ボタンを表示 */}
                  {tenantData.accountStatus === 'suspended' && isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4 text-green-600 border-green-300 hover:bg-green-50"
                      disabled={isSaving}
                      onClick={() => handleSaveAdvancedSettings('reactivate')}
                    >
                      アカウントを再開する
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">データエクスポート</h3>
                <p className="text-sm text-gray-600 mb-4">
                  法人アカウントのすべてのデータをCSV形式でエクスポートします。ユーザー情報、部署情報、プロフィール情報が含まれます。
                </p>
                <Button
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  disabled={!isAdmin || isSaving}
                  onClick={() => handleSaveAdvancedSettings('export')}
                >
                  {isSaving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      処理中...
                    </>
                  ) : (
                    'データをエクスポート'
                  )}
                </Button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-red-600 mb-2">危険な操作</h3>
                <p className="text-sm text-gray-600 mb-4">
                  以下の操作は取り消すことができません。慎重に行ってください。
                </p>
                <div className="space-y-4">
                  {/* 一時停止ボタン（アクティブ状態の場合のみ表示） */}
                  {(!tenantData.accountStatus || tenantData.accountStatus === 'active') && (
                    <div>
                      <Button
                        variant="outline"
                        className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                        disabled={!isAdmin || isSaving}
                        onClick={() => handleSaveAdvancedSettings('suspend')}
                      >
                        {isSaving ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            処理中...
                          </>
                        ) : (
                          'アカウントを一時停止'
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        法人アカウントを一時的に停止します。再開するまですべての機能が利用できなくなります。
                      </p>
                    </div>
                  )}
                  <div>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={!isAdmin || isSaving}
                      onClick={() => handleSaveAdvancedSettings('delete')}
                    >
                      {isSaving ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          処理中...
                        </>
                      ) : (
                        'アカウントを削除'
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      法人アカウントとすべてのデータを完全に削除します。この操作は取り消せません。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* 危険な操作に関する注意事項 */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex flex-row items-start">
                <HiExclamation className="text-red-600 h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
                <div className="w-full">
                  <h3 className="font-medium text-red-800 mb-2">注意事項</h3>
                  <ul className="space-y-1 text-sm text-red-700 text-justify">
                    <li>
                      •
                      アカウントを一時停止すると、テナントに所属するすべてのユーザーがログインできなくなります。
                    </li>
                    <li>
                      •
                      アカウントを削除すると、すべてのユーザーデータ、部署情報、プロフィール情報が完全に削除されます。
                    </li>
                    <li>• 削除されたデータは復元できません。</li>
                    <li>• 削除前に必ずデータのエクスポートを行うことをお勧めします。</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className="space-y-6 corporate-theme">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">アカウント設定</h1>
          <p className="text-gray-500 mt-1">法人アカウントの設定を管理します</p>
          {/* 🔥 永久利用権ユーザーの場合の表示を追加 */}
          {session?.user && (
            <div className="mt-2">
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                永久利用権ユーザー
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側のタブメニュー */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <nav className="flex flex-col">
              <button
                className={`group flex items-center px-4 py-4 text-base font-medium transition-all duration-200 ${
                  activeTab === 'general'
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-l-4 border-[#1E3A8A]'
                    : 'text-gray-700 border-l-4 border-transparent hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A] hover:border-l-[#1E3A8A]'
                }`}
                onClick={() => setActiveTab('general')}
              >
                <HiOfficeBuilding
                  className="h-6 w-6 mr-3 transition-colors"
                  style={{ color: activeTab === 'general' ? '#1E3A8A' : '#374151' }}
                />
                基本設定
              </button>
              <button
                className={`group flex items-center px-4 py-4 text-base font-medium transition-all duration-200 ${
                  activeTab === 'security'
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-l-4 border-[#1E3A8A]'
                    : 'text-gray-700 border-l-4 border-transparent hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A] hover:border-l-[#1E3A8A]'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <HiLockClosed
                  className="h-6 w-6 mr-3 transition-colors"
                  style={{ color: activeTab === 'security' ? '#1E3A8A' : '#374151' }}
                />
                セキュリティ設定
              </button>
              <button
                className={`group flex items-center px-4 py-4 text-base font-medium transition-all duration-200 ${
                  activeTab === 'notifications'
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-l-4 border-[#1E3A8A]'
                    : 'text-gray-700 border-l-4 border-transparent hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A] hover:border-l-[#1E3A8A]'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <HiMail
                  className="h-6 w-6 mr-3 transition-colors"
                  style={{ color: activeTab === 'notifications' ? '#1E3A8A' : '#374151' }}
                />
                通知設定
              </button>
              <button
                className={`group flex items-center px-4 py-4 text-base font-medium transition-all duration-200 ${
                  activeTab === 'billing'
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-l-4 border-[#1E3A8A]'
                    : 'text-gray-700 border-l-4 border-transparent hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A] hover:border-l-[#1E3A8A]'
                }`}
                onClick={() => setActiveTab('billing')}
              >
                <HiCog
                  className="h-6 w-6 mr-3 transition-colors"
                  style={{ color: activeTab === 'billing' ? '#1E3A8A' : '#374151' }}
                />
                請求情報
              </button>
              <button
                className={`group flex items-center px-4 py-4 text-base font-medium transition-all duration-200 ${
                  activeTab === 'advanced'
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-l-4 border-[#1E3A8A]'
                    : 'text-gray-700 border-l-4 border-transparent hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A] hover:border-l-[#1E3A8A]'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                <HiCog
                  className="h-6 w-6 mr-3 transition-colors"
                  style={{ color: activeTab === 'advanced' ? '#1E3A8A' : '#374151' }}
                />
                詳細設定
              </button>
            </nav>
          </div>
          {/* サポート情報 */}
          <div
            className="mt-6 rounded-md p-4"
            style={{
              backgroundColor: '#1E3A8A10',
              borderColor: '#1E3A8A30',
              borderWidth: '1px',
            }}
          >
            <div className="flex flex-row items-start">
              <HiInformationCircle className="text-[#1E3A8A] h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <div className="w-full">
                <h3 className="font-medium text-[#1E3A8A] mb-1">サポート</h3>
                <p className="text-sm text-corporate-secondary break-words hyphens-auto text-justify">
                  設定に関するお問い合わせやサポートが必要な場合は、以下よりお問い合わせください。
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#1E3A8A] border-gray-200 hover:bg-gray-50 w-full mt-4"
                  onClick={() => router.push('/support/contact?subject=法人プランサポート')}
                >
                  サポートに問い合わせる
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* 右側のコンテンツエリア */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}