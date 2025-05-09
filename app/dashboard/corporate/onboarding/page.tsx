// app/dashboard/corporate/onboarding/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import {
  HiCheck,
  HiOfficeBuilding,
  HiUsers,
  HiColorSwatch,
  HiArrowRight,
  HiOutlineExclamation,
} from 'react-icons/hi';

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  corporateRole: string | null;
}

interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  customDomain: string | null;
  maxUsers: number;
  createdAt: string;
  updatedAt: string;
  users: User[];
  departments: Department[];
}

interface OnboardingState {
  companyName: string;
  setupComplete: boolean;
  steps: {
    welcome: boolean;
    companyInfo: boolean;
    inviteUsers: boolean;
    branding: boolean;
  };
}

export default function CorporateOnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    companyName: '',
    setupComplete: false,
    steps: {
      welcome: false,
      companyInfo: false,
      inviteUsers: false,
      branding: false,
    },
  });
  const [activeStep, setActiveStep] = useState('welcome');
  const [companyName, setCompanyName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // テナント情報取得API
        const response = await fetch('/api/corporate/tenant');

        if (!response.ok) {
          throw new Error('テナント情報の取得に失敗しました');
        }

        const data = await response.json();
        setTenantData(data.tenant);

        // 会社名の初期値設定を条件付きに
        if (data.tenant?.name && !data.tenant.name.includes('の会社')) {
          setCompanyName(data.tenant.name);
          setOnboardingState((prev) => ({
            ...prev,
            companyName: data.tenant.name,
          }));
        }
        // デフォルト名の場合は空欄に
      } catch (err) {
        console.error('テナント情報取得エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session]);

  // ステップを完了としてマーク
  const completeStep = (step: keyof OnboardingState['steps']) => {
    setOnboardingState((prev) => ({
      ...prev,
      steps: {
        ...prev.steps,
        [step]: true,
      },
    }));
  };

  // 次のステップに進む
  const goToNextStep = () => {
    switch (activeStep) {
      case 'welcome':
        completeStep('welcome');
        setActiveStep('companyInfo');
        break;
      case 'companyInfo':
        completeStep('companyInfo');
        setActiveStep('inviteUsers');
        break;
      case 'inviteUsers':
        completeStep('inviteUsers');
        setActiveStep('branding');
        break;
      case 'branding':
        completeStep('branding');
        setOnboardingState((prev) => ({
          ...prev,
          setupComplete: true,
        }));
        // 全てのステップが完了したらダッシュボードへ
        router.push('/dashboard/corporate');
        break;
    }
  };

  // saveCompanyInfo関数の修正
  const saveCompanyInfo = async () => {
    if (!companyName.trim()) {
      return; // 空の会社名は送信しない
    }

    setIsSaving(true);
    try {
      // 実際のAPI呼び出し
      const response = await fetch('/api/corporate/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          type: 'general', // 既存のAPIと互換性を持たせる
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '設定の保存に失敗しました');
      }

      // 成功メッセージとステップ進行
      toast.success('会社情報を保存しました');
      goToNextStep();
    } catch (error) {
      console.error('会社情報保存エラー:', error);
      toast.error('会社情報の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // スキップしてダッシュボードへ
  const skipToFinish = () => {
    router.push('/dashboard/corporate');
  };

  // 読み込み中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // テナントデータがない場合
  if (!tenantData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <HiOutlineExclamation className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-yellow-800">法人プランが有効ではありません</h3>
            <p className="mt-2 text-yellow-700">
              法人プランの登録が完了していないか、有効化されていません。
              法人プランにご登録ください。
            </p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/subscription')}>
              プランを見る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <HiOfficeBuilding className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold">法人プランへようこそ</h1>
        <p className="text-gray-500 mt-2">
          簡単なセットアップで、チームメンバーと共に効率的に利用を開始しましょう
        </p>
      </div>

      {/* 進行状況 */}
      <div className="mb-8">
        <div className="flex justify-between items-center w-full mb-2">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                onboardingState.steps.welcome
                  ? 'bg-green-500'
                  : activeStep === 'welcome'
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
              }`}
            >
              {onboardingState.steps.welcome ? (
                <HiCheck className="h-5 w-5 text-white" />
              ) : (
                <span className="text-white text-sm">1</span>
              )}
            </div>
            <div className="mx-2 h-1 w-16 bg-gray-200"></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                onboardingState.steps.companyInfo
                  ? 'bg-green-500'
                  : activeStep === 'companyInfo'
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
              }`}
            >
              {onboardingState.steps.companyInfo ? (
                <HiCheck className="h-5 w-5 text-white" />
              ) : (
                <span className="text-white text-sm">2</span>
              )}
            </div>
            <div className="mx-2 h-1 w-16 bg-gray-200"></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                onboardingState.steps.inviteUsers
                  ? 'bg-green-500'
                  : activeStep === 'inviteUsers'
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
              }`}
            >
              {onboardingState.steps.inviteUsers ? (
                <HiCheck className="h-5 w-5 text-white" />
              ) : (
                <span className="text-white text-sm">3</span>
              )}
            </div>
            <div className="mx-2 h-1 w-16 bg-gray-200"></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                onboardingState.steps.branding
                  ? 'bg-green-500'
                  : activeStep === 'branding'
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
              }`}
            >
              {onboardingState.steps.branding ? (
                <HiCheck className="h-5 w-5 text-white" />
              ) : (
                <span className="text-white text-sm">4</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ステップコンテンツ */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-6">
        {/* ステップ1: ようこそ */}
        {activeStep === 'welcome' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">法人プランへようこそ</h2>
            <p className="text-gray-600 mb-6 text-justify">
              法人プランへのご登録ありがとうございます。この初期設定ウィザードでは、以下のステップを通じてチーム全体で効率的に利用を開始するための準備を行います。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <HiOfficeBuilding className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium">会社情報の設定</h3>
                <p className="text-sm text-gray-500 mt-1">
                  貴社の基本情報を登録し、社内共有の基盤を作ります
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <HiUsers className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium">メンバー招待</h3>
                <p className="text-sm text-gray-500 mt-1">
                  チームメンバーを招待し、情報共有を始めましょう
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <HiColorSwatch className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium">ブランディング設定</h3>
                <p className="text-sm text-gray-500 mt-1">
                  企業カラーやロゴを設定して統一感のある見た目にします
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>このウィザードの目的:</strong>{' '}
                法人アカウントの基本設定を行い、チームメンバーが統一されたブランディングのもとでSNS情報を共有できる環境を整えます。各ステップは後からでも変更可能です。
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={skipToFinish}>
                スキップして後で設定
              </Button>
              <Button onClick={goToNextStep}>
                始める <HiArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ステップ2: 会社情報 */}
        {activeStep === 'companyInfo' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">会社情報の設定</h2>
            <p className="text-gray-600 mb-6 text-justify">
              基本的な会社情報を入力して、法人アカウントを設定しましょう。
            </p>

            <div className="space-y-4 mb-8">
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
                  className="w-full"
                  placeholder="例: 株式会社 共有商事"
                  required
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  業種（任意）
                </label>
                <select
                  id="industry"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="IT">IT・テクノロジー</option>
                  <option value="finance">金融・保険</option>
                  <option value="manufacturing">製造業</option>
                  <option value="retail">小売・流通</option>
                  <option value="service">サービス業</option>
                  <option value="healthcare">医療・ヘルスケア</option>
                  <option value="education">教育</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="employeeCount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  従業員数（任意）
                </label>
                <select
                  id="employeeCount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="1-10">1-10人</option>
                  <option value="11-50">11-50人</option>
                  <option value="51-200">51-200人</option>
                  <option value="201-500">201-500人</option>
                  <option value="501-1000">501-1000人</option>
                  <option value="1001+">1001人以上</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={skipToFinish}>
                スキップ
              </Button>
              <Button onClick={saveCompanyInfo} disabled={!companyName.trim() || isSaving}>
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    次へ <HiArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ステップ3: メンバー招待 */}
        {activeStep === 'inviteUsers' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">チームメンバーを招待</h2>
            <p className="text-gray-600 mb-6 text-justify">
              チームメンバーを招待して、一緒に利用を始めましょう。
              後からいつでもメンバーを追加できます。
            </p>

            <div className="mb-8">
              <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス（任意）
              </label>
              <p className="text-xs text-gray-500 mb-2 text-justify">
                複数のメールアドレスはカンマで区切るか、1行に1つずつ入力してください
              </p>
              <textarea
                id="emails"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: yamada@example.com, tanaka@example.com"
              ></textarea>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={skipToFinish}>
                スキップ
              </Button>
              <Button onClick={goToNextStep}>
                次へ <HiArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ステップ4: ブランディング設定 */}
        {activeStep === 'branding' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">ブランディング設定</h2>
            <p className="text-gray-600 mb-6 text-justify">
              企業カラーやロゴを会社プロフィールに反映させることができます。
              今すぐ設定するか、後からダッシュボードで設定することもできます。
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 text-justify">
                詳細なブランディング設定は、この後「ブランディング設定」メニューからいつでも行えます。
                今は基本設定を完了し、詳細は後から調整することもできます。
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={skipToFinish}>
                スキップして完了
              </Button>
              <Button onClick={goToNextStep}>
                設定を完了 <HiCheck className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}