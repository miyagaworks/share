// components/corporate/MemberProfileForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, FormGroup } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { QuickIntroButton } from '@/components/ui/QuickIntroButton';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { UserData, ProfileUpdateData } from '@/types/profiles';

import {
  HiUser,
  HiMail,
  HiPhone,
  HiOfficeBuilding,
  HiAnnotation,
  HiSparkles,
  HiBriefcase,
} from 'react-icons/hi';

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  corporatePrimary: string | null;
  corporateSecondary: string | null;
}

interface MemberProfileFormProps {
  userData: UserData | null;
  tenantData: TenantData | null;
  isLoading: boolean;
  onSave: (data: ProfileUpdateData) => Promise<void>;
}

export function MemberProfileForm({
  userData,
  tenantData,
  isLoading,
  onSave,
}: MemberProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // 姓名とフリガナを分割して管理
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    nameEn: '',
    bio: '',
    phone: '',
    position: '',
  });

  // テナントのカラー設定
  const corporatePrimary = tenantData?.corporatePrimary || 'var(--color-corporate-primary)';

  // Reactの状態でホバーを管理
  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false);
  const [isSecondaryHovered, setIsSecondaryHovered] = useState(false);

  // プライマリーボタンのスタイル
  const primaryButtonStyle = {
    backgroundColor: isPrimaryHovered
      ? 'var(--color-corporate-secondary)'
      : 'var(--color-corporate-primary)',
    borderColor: 'var(--color-corporate-primary)',
    transition: 'background-color 0.2s',
  };

  // 姓名とフリガナを分割する関数
  const splitNameAndKana = (user: UserData) => {
    // 姓名の分割
    let lastName = user.lastName || '';
    let firstName = user.firstName || '';

    // 分割されたフィールドがない場合は結合されたフィールドから分割
    if (!lastName && !firstName && user.name) {
      const nameParts = user.name.split(' ');
      lastName = nameParts[0] || '';
      firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }

    // フリガナの分割
    let lastNameKana = user.lastNameKana || '';
    let firstNameKana = user.firstNameKana || '';

    // 分割されたフィールドがない場合は結合されたフィールドから分割
    if (!lastNameKana && !firstNameKana && user.nameKana) {
      const kanaParts = user.nameKana.split(' ');
      lastNameKana = kanaParts[0] || '';
      firstNameKana = kanaParts.length > 1 ? kanaParts.slice(1).join(' ') : '';
    }

    return { lastName, firstName, lastNameKana, firstNameKana };
  };

  // 初期データの設定
  useEffect(() => {
    if (userData) {
      const { lastName, firstName, lastNameKana, firstNameKana } = splitNameAndKana(userData);

      setFormData({
        lastName,
        firstName,
        lastNameKana,
        firstNameKana,
        // 英語名はそのまま使用 - 自動生成しない
        nameEn: userData.nameEn || '',
        bio: userData.bio || '',
        phone: userData.phone || '',
        position: userData.position || '',
      });
      setImage(userData.image);
    }
  }, [userData]);

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
      const processedLastName = formData.lastName.trim() || undefined;
      const processedFirstName = formData.firstName.trim() || undefined;
      const processedLastNameKana = formData.lastNameKana.trim() || undefined;
      const processedFirstNameKana = formData.firstNameKana.trim() || undefined;
      const processedNameEn = formData.nameEn.trim() || undefined; // 英語名はそのまま使用
      const processedBio = formData.bio.trim() || undefined;
      const processedPhone = formData.phone.trim() || undefined;
      const processedPosition = formData.position.trim() || undefined;

      // データを準備
      const updateData: ProfileUpdateData = {
        lastName: processedLastName,
        firstName: processedFirstName,
        lastNameKana: processedLastNameKana,
        firstNameKana: processedFirstNameKana,
        nameEn: processedNameEn, // 英語名はユーザー入力をそのまま使用
        bio: processedBio,
        phone: processedPhone,
        position: processedPosition,
        image: image !== userData?.image ? image : undefined,
      };

      // 親コンポーネントの保存関数を呼び出し
      await onSave(updateData);

      toast.success('プロフィールを更新しました');
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error('プロフィールの更新に失敗しました');
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

  // データがない場合のエラー表示
  if (!userData || !tenantData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">プロフィール情報の取得に失敗しました</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 基本プロフィール */}
      <div
        className="rounded-lg border border-gray-200 bg-white p-6 mb-6 shadow-sm"
        style={{ borderColor: `${corporatePrimary}40` }}
      >
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
        <p className="text-sm text-gray-500 mb-6 text-justify">
          あなたの基本情報を入力してください。これらの情報は自己紹介ページに表示されます。
        </p>

        <FormGroup>
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="relative">
              <ImageUpload
                value={image}
                onChange={(value) => setImage(value)}
                disabled={isSaving}
              />
            </div>
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                プロフィール写真をアップロード（JPG, PNG, 最大1MB）
              </span>
            </p>
          </div>

          {/* 姓名分割フィールド */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiUser className="mr-2 h-4 w-4 text-gray-500" />姓
              </label>
              <Input
                name="lastName"
                placeholder="山田"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiUser className="mr-2 h-4 w-4 text-gray-500" />名
              </label>
              <Input
                name="firstName"
                placeholder="太郎"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
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

          {/* フリガナ分割フィールド */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiUser className="mr-2 h-4 w-4 text-gray-500" />
                姓（フリガナ）
              </label>
              <Input
                name="lastNameKana"
                placeholder="ヤマダ"
                value={formData.lastNameKana}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiUser className="mr-2 h-4 w-4 text-gray-500" />
                名（フリガナ）
              </label>
              <Input
                name="firstNameKana"
                placeholder="タロウ"
                value={formData.firstNameKana}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            スマートフォンの連絡先に登録する際のフリガナです。
          </p>

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
          <div className="mt-6 mb-4 border border-corporate-primary/20 rounded-lg bg-corporate-primary/5 p-4">
            <div className="flex items-center mb-2">
              <HiSparkles className="text-corporate-primary h-5 w-5 mr-2" />
              <h3 className="text-corporate-primary/90 font-medium">自己紹介文を簡単に作成</h3>
            </div>
            <p className="text-sm text-corporate-primary/80 mb-4 text-justify">
              AIを使って質問に答えるだけで、あなたに最適な自己紹介文を自動生成できます。
              現在の編集内容は保存してから利用することをおすすめします。
            </p>
            <QuickIntroButton />
          </div>
        </FormGroup>
      </div>

      {/* 連絡先情報 */}
      <div
        className="rounded-lg border border-gray-200 bg-white p-6 mb-6 shadow-sm"
        style={{ borderColor: `${corporatePrimary}40` }}
      >
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
              <HiOfficeBuilding className="mr-2 h-4 w-4 text-gray-500" />
              部署
            </label>
            <Input
              value={userData.department?.name || '未設定'}
              disabled={true}
              helperText="部署の変更は管理者にお問い合わせください。"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <HiBriefcase className="mr-2 h-4 w-4 text-gray-500" />
              役職
            </label>
            <Input
              name="position"
              placeholder="マネージャー、プロジェクトリーダーなど"
              value={formData.position}
              onChange={handleChange}
              disabled={isSaving}
              helperText="あなたの役職や職位を入力してください。"
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

      <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        {/* セカンダリーボタン */}
        <Button
          type="button"
          variant="outline"
          style={{
            color: isSecondaryHovered ? 'white' : '#1E3A8A',
            backgroundColor: isSecondaryHovered ? '#1E3A8A' : 'transparent',
            borderColor: '#1E3A8A',
            transition: 'all 0.2s',
          }}
          onMouseEnter={() => setIsSecondaryHovered(true)}
          onMouseLeave={() => setIsSecondaryHovered(false)}
          onClick={() => (window.location.href = '/dashboard/corporate-member')}
          className="w-full sm:w-auto"
        >
          キャンセル
        </Button>

        {/* プライマリーボタン */}
        <Button
          type="submit"
          disabled={isSaving}
          loading={isSaving}
          loadingText="更新中..."
          style={primaryButtonStyle}
          onMouseEnter={() => setIsPrimaryHovered(true)}
          onMouseLeave={() => setIsPrimaryHovered(false)}
          className="w-full sm:w-auto"
        >
          プロフィールを更新
        </Button>
      </div>
    </form>
  );
}