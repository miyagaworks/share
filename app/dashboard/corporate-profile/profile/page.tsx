// app/dashboard/corporate-profile/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input, Textarea, FormGroup } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'react-hot-toast';
import { QuickIntroButton } from '@/components/ui/QuickIntroButton';
import {
  HiUser,
  HiMail,
  HiPhone,
  HiOfficeBuilding,
  HiGlobe,
  HiAnnotation,
  HiLockClosed,
  HiSparkles,
} from 'react-icons/hi';

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

// ユーザーデータの型定義
interface UserData {
  id: string;
  name: string | null;
  nameEn: string | null;
  bio: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  companyUrl: string | null;
  companyLabel: string | null;
  image: string | null;
  corporateRole: string | null;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
}

export default function CorporateProfileEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    bio: '',
    phone: '',
    company: '',
    companyUrl: '',
    companyLabel: '',
  });
  const [error, setError] = useState<string | null>(null);

  // データ取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/corporate-profile');

        if (!response.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }

        const data = await response.json();
        const user = data.user;
        const tenant = data.tenant;

        setUserData(user);
        setTenantData(tenant);
        setIsAdmin(user.corporateRole === 'admin');

        // フォームデータを設定
        setFormData({
          name: user.name || '',
          nameEn: user.nameEn || '',
          bio: user.bio || '',
          phone: user.phone || '',
          company: user.company || '',
          companyUrl: user.companyUrl || '',
          companyLabel: user.companyLabel || '会社HP',
        });

        setImage(user.image);
        setError(null);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('プロフィール情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  // 入力フォーム変更のハンドリング
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // 各フィールドの処理
      const processedName = formData.name.trim() || undefined;
      const processedNameEn = formData.nameEn.trim() || undefined;
      const processedBio = formData.bio.trim() || undefined;
      const processedPhone = formData.phone.trim() || undefined;

      // 法人ユーザーの場合、会社名はテナント名を使用
      const processedCompany = isAdmin
        ? formData.company.trim() || undefined
        : userData?.company || undefined; // 一般メンバーは会社名を変更できない

      // 会社URLの処理
      let processedCompanyUrl: string | undefined = isAdmin
        ? formData.companyUrl.trim()
        : userData?.companyUrl || undefined; // 一般メンバーは会社URLを変更できない

      if (processedCompanyUrl && !/^https?:\/\//i.test(processedCompanyUrl)) {
        processedCompanyUrl = `https://${processedCompanyUrl}`;
      }

      // 会社ラベルの処理
      const processedCompanyLabel = isAdmin
        ? formData.companyLabel.trim() || undefined
        : userData?.companyLabel || undefined; // 一般メンバーは会社ラベルを変更できない

      // API呼び出し
      const response = await fetch('/api/corporate-profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: processedName,
          nameEn: processedNameEn,
          bio: processedBio,
          phone: processedPhone,
          company: processedCompany,
          companyUrl: processedCompanyUrl,
          companyLabel: processedCompanyLabel,
          image: image !== userData?.image ? image : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'プロフィールの更新に失敗しました');
      }

      toast.success('プロフィールを更新しました');

      // 更新後のデータを取得して表示を更新
      const updatedDataResponse = await fetch('/api/corporate-profile');
      if (updatedDataResponse.ok) {
        const updatedData = await updatedDataResponse.json();
        setUserData(updatedData.user);

        // フォームデータを更新
        setFormData({
          name: updatedData.user.name || '',
          nameEn: updatedData.user.nameEn || '',
          bio: updatedData.user.bio || '',
          phone: updatedData.user.phone || '',
          company: updatedData.user.company || '',
          companyUrl: updatedData.user.companyUrl || '',
          companyLabel: updatedData.user.companyLabel || '会社HP',
        });
      }
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">プロフィール情報を読み込んでいます...</p>
      </div>
    );
  }

  // エラー表示
  if (error || !userData || !tenantData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">
          エラーが発生しました: {error || 'データを取得できませんでした'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  // 法人カラーの適用
  const primaryColor = tenantData.primaryColor || '#3B82F6';

  // ボタンスタイル
  const buttonStyle = {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <HiUser className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロフィール編集</h1>
          <p className="text-muted-foreground">あなたの基本情報を管理できます</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 基本プロフィール */}
        <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <HiUser className="mr-2 h-5 w-5 text-gray-600" />
              基本プロフィール
            </h2>
            {userData.department && (
              <div className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center">
                <HiOfficeBuilding className="mr-1 h-3 w-3" />
                {userData.department.name}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            あなたの基本情報を入力してください。これらの情報は公開プロフィールに表示されます。
          </p>

          <FormGroup>
            <div className="flex flex-col items-center space-y-4 mb-6">
              <ImageUpload
                value={image}
                onChange={(value) => setImage(value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                クリックして画像をアップロード（JPG, PNG, 最大1MB）
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <HiUser className="mr-2 h-4 w-4 text-gray-500" />
                  名前（日本語）
                </label>
                <Input
                  name="name"
                  placeholder="山田 太郎"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <HiUser className="mr-2 h-4 w-4 text-gray-500" />
                  名前（英語/ローマ字）
                </label>
                <Input
                  name="nameEn"
                  placeholder="Taro Yamada"
                  value={formData.nameEn}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiAnnotation className="mr-2 h-4 w-4 text-gray-500" />
                自己紹介
              </label>
              <Textarea
                name="bio"
                placeholder="自己紹介（最大300文字）"
                value={formData.bio}
                onChange={handleChange}
                disabled={isSaving}
                helperText="あなたのプロフィールページに表示される自己紹介文です。最大300文字まで入力できます。"
              />
            </div>

            {/* かんたん自己紹介ボタンを追加 */}
            <div className="mt-6 mb-4 border border-blue-200 rounded-lg bg-blue-50 p-4">
              <div className="flex items-center mb-2">
                <HiSparkles className="text-blue-600 h-5 w-5 mr-2" /> {/* アイコンを変更 */}
                <h3 className="text-blue-800 font-medium">自己紹介文を簡単に作成</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                AIを使って質問に答えるだけで、あなたに最適な自己紹介文を自動生成できます。
                現在の編集内容は保存してから利用することをおすすめします。
              </p>
              <QuickIntroButton />
            </div>
          </FormGroup>
        </div>

        {/* 連絡先情報 */}
        <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center mb-4">
            <HiPhone className="mr-2 h-5 w-5 text-gray-600" />
            連絡先情報
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            あなたの連絡先情報を入力してください。これらの情報は共有されたプロフィールで利用できます。
          </p>

          <FormGroup>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiMail className="mr-2 h-4 w-4 text-gray-500" />
                メールアドレス
              </label>
              <Input
                value={userData.email}
                disabled={true}
                helperText="メールアドレスは変更できません。認証情報として使用されています。"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiPhone className="mr-2 h-4 w-4 text-gray-500" />
                電話番号
              </label>
              <Input
                name="phone"
                placeholder="090-XXXX-XXXX"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
          </FormGroup>
        </div>

        {/* 会社/組織情報 */}
        <div
          className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <HiOfficeBuilding className="mr-2 h-5 w-5 text-gray-600" />
              会社/組織情報
            </h2>
            {!isAdmin && (
              <div className="text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-xs flex items-center">
                <HiLockClosed className="mr-1 h-3 w-3" />
                管理者のみ編集可能
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {isAdmin
              ? 'あなたの所属する会社または組織の情報を入力してください。'
              : 'この情報は法人管理者によって管理されています。'}
          </p>

          <FormGroup>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiOfficeBuilding className="mr-2 h-4 w-4 text-gray-500" />
                会社/組織名
              </label>
              <Input
                name="company"
                placeholder="株式会社〇〇"
                value={isAdmin ? formData.company : tenantData.name}
                onChange={handleChange}
                disabled={!isAdmin || isSaving}
              />
              {!isAdmin && (
                <p className="mt-1 text-xs text-gray-500">
                  会社名は法人設定から自動的に取得されます
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiGlobe className="mr-2 h-4 w-4 text-gray-500" />
                会社/組織のWebサイトURL
              </label>
              <Input
                name="companyUrl"
                placeholder="https://example.com"
                value={formData.companyUrl}
                onChange={handleChange}
                disabled={!isAdmin || isSaving}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiGlobe className="mr-2 h-4 w-4 text-gray-500" />
                会社/組織のリンク表示名
              </label>
              <Input
                name="companyLabel"
                placeholder="会社HP"
                value={formData.companyLabel}
                onChange={handleChange}
                disabled={!isAdmin || isSaving}
                helperText="プロフィールページで表示されるボタンの名前です（デフォルト: 会社HP）"
              />
            </div>
          </FormGroup>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            loading={isSaving}
            loadingText="更新中..."
            fullWidth
            style={buttonStyle}
          >
            プロフィールを更新
          </Button>
        </div>
      </form>
    </div>
  );
}