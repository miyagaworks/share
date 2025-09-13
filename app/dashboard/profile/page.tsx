// app/dashboard/profile/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Input, Textarea, FormGroup } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { QuickIntroButton } from '@/components/ui/QuickIntroButton';
import { SecuritySettingsSection } from '@/components/SecuritySettingsSection';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  HiUser,
  HiMail,
  HiPhone,
  HiOfficeBuilding,
  HiGlobe,
  HiAnnotation,
  HiSparkles,
} from 'react-icons/hi';
// UserWithProfileを修正
interface UserWithProfile {
  id?: string;
  email?: string;
  name?: string;
  image?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  lastNameKana?: string | null;
  firstNameKana?: string | null;
  nameEn?: string | null;
  bio?: string | null;
  phone?: string | null;
  company?: string | null;
  companyUrl?: string | null;
  companyLabel?: string | null;
  profile?: {
    id?: string;
    userId?: string;
    slug?: string | null;
    // 必要に応じて他のフィールドを追加
  } | null;
}
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    // 姓名分割
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    nameEn: '',
    bio: '',
    email: '',
    phone: '',
    company: '',
    companyUrl: '',
    companyLabel: '',
  });
  const [image, setImage] = useState<string | null>(null);
  // プロフィールデータを取得する関数
  const fetchUserData = async (): Promise<UserWithProfile> => {
    try {
      // キャッシュ問題を避けるためのタイムスタンプ付与
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/profile?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      if (!response.ok) {
        throw new Error('プロフィール情報の取得に失敗しました');
      }
      const data = await response.json();
      return data.user as UserWithProfile;
    } catch (error) {
      toast.error('プロフィール情報の取得に失敗しました');
      throw error;
    }
  };
  // 初期データ読み込み
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await fetchUserData();
        setFormData({
          lastName: userData?.lastName || '',
          firstName: userData?.firstName || '',
          lastNameKana: userData?.lastNameKana || '',
          firstNameKana: userData?.firstNameKana || '',
          nameEn: userData?.nameEn || '',
          bio: userData?.bio || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          company: userData?.company || '',
          companyUrl: userData?.companyUrl || '',
          companyLabel: userData?.companyLabel || '会社HP',
        });
        setImage(userData?.image || null);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [session, status, router]);
  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      // 各フィールドの処理
      const processedLastName = formData.lastName.trim() || undefined;
      const processedFirstName = formData.firstName.trim() || undefined;
      const processedLastNameKana = formData.lastNameKana.trim() || undefined;
      const processedFirstNameKana = formData.firstNameKana.trim() || undefined;
      // 英語名はユーザー入力をそのまま使用（自動生成しない）
      const processedNameEn = formData.nameEn.trim() || undefined;
      const processedBio = formData.bio.trim() || undefined;
      const processedPhone = formData.phone.trim() || undefined;
      const processedCompany = formData.company.trim() || undefined;
      const processedCompanyLabel = formData.companyLabel.trim() || undefined;
      // 会社URLの処理
      let processedCompanyUrl: string | undefined = formData.companyUrl.trim();
      if (processedCompanyUrl) {
        // URLにプロトコルが含まれていない場合は追加
        if (!/^https?:\/\//i.test(processedCompanyUrl)) {
          processedCompanyUrl = `https://${processedCompanyUrl}`;
        }
      } else {
        processedCompanyUrl = undefined;
      }
      // 新しいエンドポイントを使用してデータを送信
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastName: processedLastName,
          firstName: processedFirstName,
          lastNameKana: processedLastNameKana,
          firstNameKana: processedFirstNameKana,
          nameEn: processedNameEn,
          bio: processedBio,
          phone: processedPhone,
          company: processedCompany,
          companyUrl: processedCompanyUrl,
          companyLabel: processedCompanyLabel,
          image,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
      }
      const data = await response.json();
      if (data.success) {
        toast.success('プロフィールを更新しました');
        // フォームを直接更新する（サーバーアクションを使わない）
        if (data.user) {
          setFormData({
            lastName: data.user.lastName || '',
            firstName: data.user.firstName || '',
            lastNameKana: data.user.lastNameKana || '',
            firstNameKana: data.user.firstNameKana || '',
            nameEn: data.user.nameEn || '',
            bio: data.user.bio || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            company: data.user.company || '',
            companyUrl: data.user.companyUrl || '',
            companyLabel: data.user.companyLabel || '会社HP',
          });
          setImage(data.user.image);
        }
      } else {
        throw new Error('プロフィールの更新に失敗しました');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  // 入力フィールドの変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // 読み込み中の表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">プロフィール情報を読み込んでいます...</p>
      </div>
    );
  }
  // コンテンツのトランジション設定
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };
  return (
    <motion.div initial="hidden" animate="visible" variants={contentVariants} className="space-y-6">
      <div className="flex items-center mb-6">
        <HiUser className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロフィール編集</h1>
          <p className="text-muted-foreground">あなたの基本情報を管理できます</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <DashboardCard
          title="基本プロフィール"
          description="あなたの基本情報を入力してください。これらの情報は公開プロフィールに表示されます。"
          className="text-justify"
        >
          <FormGroup>
            <div className="flex flex-col items-center space-y-4 mb-6">
              <ImageUpload
                value={image}
                onChange={(value) => setImage(value)}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500 text-justify">
                クリックして画像をアップロード（JPG, PNG, 最大5MB）
              </p>
            </div>
            {/* 姓名分割フィールド */}
            <div className="grid gap-6 md:grid-cols-2">
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
            {/* フリガナ分割フィールド */}
            <div className="grid gap-6 md:grid-cols-2">
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
            <p className="text-xs text-muted-foreground mt-1">
              スマートフォンの連絡先に登録する際のフリガナです。
            </p>
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
                className="text-justify"
              />
              {/* かんたん自己紹介ボタン */}
              <div className="mt-6 mb-4 border border-blue-200 rounded-lg bg-blue-50 p-4">
                <div className="flex items-center mb-2">
                  <HiSparkles className="text-blue-600 h-5 w-5 mr-2" />
                  <h3 className="text-blue-800 font-medium">自己紹介文を簡単に作成</h3>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  AIを使って質問に答えるだけで、あなたに最適な自己紹介文を自動生成できます。
                  現在の編集内容は保存してから利用することをおすすめします。
                </p>
                <QuickIntroButton />
              </div>
            </div>
          </FormGroup>
        </DashboardCard>
        <DashboardCard
          title="連絡先情報"
          description="あなたの連絡先情報を入力してください。これらの情報は共有されたプロフィールで利用できます。"
          className="mt-6 text-justify"
        >
          <FormGroup>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiMail className="mr-2 h-4 w-4 text-gray-500" />
                メールアドレス
              </label>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={true}
                helperText="メールアドレスは変更できません。認証情報として使用されています。"
                className="text-justify"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiPhone className="mr-2 h-4 w-4 text-gray-500" />
                電話番号
              </label>
              <Input
                name="phone"
                placeholder="090XXXXXXXX"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
          </FormGroup>
        </DashboardCard>
        <DashboardCard
          title="会社/組織情報"
          description="あなたの所属する会社または組織の情報を入力してください。"
          className="mt-6 text-justify"
        >
          <FormGroup>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <HiOfficeBuilding className="mr-2 h-4 w-4 text-gray-500" />
                会社/組織名
              </label>
              <Input
                name="company"
                placeholder="株式会社〇〇"
                value={formData.company}
                onChange={handleChange}
                disabled={isSaving}
              />
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
                disabled={isSaving}
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
                disabled={isSaving}
                helperText="プロフィールページで表示されるボタンの名前です（デフォルト: 会社HP）"
                className="text-justify"
              />
            </div>
          </FormGroup>
        </DashboardCard>
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            loading={isSaving}
            loadingText="更新中..."
            fullWidth
          >
            プロフィールを更新
          </Button>
        </div>
      </form>
      <SecuritySettingsSection />
    </motion.div>
  );
}
