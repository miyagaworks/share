// app/dashboard/corporate/users/invite/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { HiMail, HiArrowLeft, HiInformationCircle } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
// 部署情報の型定義
interface Department {
  id: string;
  name: string;
}
// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  maxUsers: number;
  currentUserCount: number;
  departments: Department[];
}
export default function InviteUserPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [emails, setEmails] = useState<string>('');
  const [role, setRole] = useState<string>('member');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  // テナント情報と部署情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;
      try {
        setIsLoading(true);
        // テナント情報取得API
        const tenantResponse = await fetch('/api/corporate/tenant');
        if (!tenantResponse.ok) {
          throw new Error('テナント情報の取得に失敗しました');
        }
        const tenantData = await tenantResponse.json();
        // 管理者権限がない場合はリダイレクト
        if (tenantData.userRole !== 'admin') {
          router.push('/dashboard/corporate/users');
          return;
        }
        // 部署情報取得API
        const deptResponse = await fetch('/api/corporate/departments');
        if (!deptResponse.ok) {
          toast.error('部署情報の取得に失敗しました。一部の機能が制限されます');
          setTenantData({
            ...tenantData.tenant,
            currentUserCount: tenantData.tenant.users?.length || 0,
            departments: [], // 空の配列をセット
          });
        } else {
          const deptData = await deptResponse.json();
          const departments = deptData.departments || [];
          setDepartments(departments);
          setTenantData({
            ...tenantData.tenant,
            currentUserCount: tenantData.tenant.users?.length || 0,
            departments: departments,
          });
        }
        setError(null);
      } catch {
        setError('テナント情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenantData();
  }, [session, router]);
  // ユーザー招待を送信する処理
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim()) {
      toast.error('メールアドレスを入力してください');
      return;
    }
    // 複数のメールアドレスを配列に変換（カンマまたは改行で区切り）
    const emailList = emails
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
    // メールアドレスの形式を検証
    const invalidEmails = emailList.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      toast.error(`無効なメールアドレスがあります: ${invalidEmails.join(', ')}`);
      return;
    }
    // テナントのユーザー上限を超えるかどうかをチェック
    if (tenantData && tenantData.currentUserCount + emailList.length > tenantData.maxUsers) {
      toast.error(
        `ユーザー数の上限（${tenantData.maxUsers}人）を超えています。アップグレードするか、既存のユーザーを削除してください。`,
      );
      return;
    }
    try {
      setIsSending(true);
      // 招待APIを呼び出す
      const response = await fetch('/api/corporate/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailList,
          role,
          departmentId: departmentId || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || '招待の送信に失敗しました');
      }
      const result = await response.json();
      // 招待結果の処理
      if (result.errors && result.errors.length > 0) {
        // エラーがあるが一部成功した場合
        if (result.invitedCount > 0) {
          toast.success(`${result.invitedCount}人のユーザーに招待を送信しました`);
          toast.error(`${result.errors.length}件のエラーがありました: ${result.errors.join(', ')}`);
        } else {
          // すべて失敗した場合
          throw new Error(`招待の送信に失敗しました: ${result.errors.join(', ')}`);
        }
      } else {
        // すべて成功した場合
        toast.success(`${result.invitedCount}人のユーザーに招待を送信しました`);
      }
      // ユーザー一覧ページに戻る
      router.push('/dashboard/corporate/users');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '招待の送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };
  // メールアドレスの検証
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
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
          className="mt-4"
          variant="corporate"
          onClick={() => router.push('/dashboard/subscription')}
        >
          プランを見る
        </Button>
      </div>
    );
  }
  // 部署情報のデバッグ出力
  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => router.push('/dashboard/corporate/users')}
        >
          <HiArrowLeft className="h-5 w-5 text-gray-500" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ユーザーを招待</h1>
          <p className="text-gray-500 mt-1">
            {tenantData.currentUserCount}/{tenantData.maxUsers} ユーザー
          </p>
        </div>
      </div>
      {/* 招待フォーム */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleInviteSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                複数のメールアドレスはカンマで区切るか、1行に1つずつ入力してください
              </p>
              <textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: yamada@example.com, tanaka@example.com"
                required
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  役割
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">メンバー（通常権限）</option>
                  <option value="admin">管理者（全ての権限）</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  部署
                </label>
                <select
                  id="department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">部署を選択（任意）</option>
                  {departments && departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>部署が登録されていません</option>
                  )}
                </select>
                {departments.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    部署が登録されていません。部署管理ページで部署を登録してください。
                  </p>
                )}
              </div>
            </div>
            {/* 残りユーザー数の警告表示 */}
            {tenantData.maxUsers - tenantData.currentUserCount <= 5 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-700">
                  残り{tenantData.maxUsers - tenantData.currentUserCount}人の招待が可能です。
                  上限に達した場合は、プランのアップグレードをご検討ください。
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="corporateOutline"
                onClick={() => router.push('/dashboard/corporate/users')}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="corporate"
                disabled={isSending}
                className="flex items-center"
                style={{ backgroundColor: '#1E3A8A', color: 'white' }}
              >
                {isSending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    送信中...
                  </>
                ) : (
                  <>
                    <HiMail className="mr-2 h-4 w-4" />
                    招待を送信
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
      {/* ヘルプセクション - スタイルクラスを変更 */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 w-full">
        <div className="flex flex-row items-start">
          <HiInformationCircle className="text-blue-900 h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
          <div className="w-full">
            <h3 className="font-medium text-blue-900 mb-1">招待について</h3>
            <p className="text-sm text-corporate-secondary break-words hyphens-auto text-justify">
              招待されたユーザーには、メールで招待リンクが送信されます。
              ユーザーがリンクをクリックすると、パスワードの設定後にテナントに参加できます。
              招待は72時間有効です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}