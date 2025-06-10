// components/corporate/CorporateSnsIntegration.tsx
import { useEffect } from 'react';
import { HiOfficeBuilding, HiExclamation, HiInformationCircle, HiCheck } from 'react-icons/hi';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { type SnsPlatform, SNS_METADATA } from '@/types/sns';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// 型定義
interface SnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
}

interface CorporateSnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
  isRequired: boolean;
}

interface TenantData {
  id: string;
  name: string;
  corporatePrimary?: string | null;
  corporateSecondary?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

interface CorporateSnsIntegrationProps {
  corporateSnsLinks: CorporateSnsLink[];
  personalSnsLinks: SnsLink[];
  tenantData: TenantData | null;
}

// プラットフォーム名を取得する関数
const getDisplayName = (platformCode: string): string => {
  // platformCodeが有効なSnsPlatformの場合、SNS_METADATAから名前を取得
  if (Object.keys(SNS_METADATA).includes(platformCode)) {
    return SNS_METADATA[platformCode as SnsPlatform].name;
  }
  // それ以外の場合はそのまま表示
  return platformCode;
};

export function CorporateSnsIntegration({
  corporateSnsLinks,
  personalSnsLinks,
  tenantData,
}: CorporateSnsIntegrationProps) {
  // ★★★ useEffectを追加 ★★★
  useEffect(() => {
    const debugAndFix = () => {
      // 全ボタンを確認
      const allButtons = document.querySelectorAll('button');
      // 対象ボタンを探す
      const targetButtons = Array.from(allButtons).filter(
        (btn) => btn.textContent?.includes('設定を変更') || btn.textContent?.includes('設定する'),
      );
      targetButtons.forEach((btn) => {
        // 色を変更
        btn.style.setProperty('background-color', '#1E3A8A', 'important');
        btn.style.setProperty('border-color', '#1E3A8A', 'important');
        btn.style.setProperty('color', 'white', 'important');
      });
    };
    // 複数のタイミングで実行
    debugAndFix();
    setTimeout(debugAndFix, 100);
    setTimeout(debugAndFix, 500);
    setTimeout(debugAndFix, 1000);
  }, [corporateSnsLinks, personalSnsLinks]);

  // テナントカラーの取得（優先順位を考慮）
  const corporatePrimary = tenantData?.primaryColor || tenantData?.corporatePrimary || '#1E3A8A';

  // 法人必須SNSが個人SNSに設定されているかチェック
  const getSetupStatus = (corporateLink: CorporateSnsLink) => {
    const personalLink = personalSnsLinks.find((link) => link.platform === corporateLink.platform);
    return personalLink ? 'set' : 'missing';
  };

  // SNSを直接追加する関数
  const handleAddSns = async (link: CorporateSnsLink) => {
    try {
      // ユーザー名を抽出するための処理
      let username = link.username;
      // 各プラットフォーム用のユーザー名がない場合はURLから抽出を試みる
      if (!username && link.url) {
        try {
          // URLからユーザー名部分を抽出する簡単な例
          const url = new URL(link.url);
          const pathParts = url.pathname.split('/').filter(Boolean);
          // プラットフォームごとに異なるロジック
          if (link.platform === 'YouTube' && pathParts[0]?.startsWith('@')) {
            username = pathParts[0].substring(1); // '@' を削除
          } else if (pathParts.length > 0) {
            username = pathParts[pathParts.length - 1]; // 最後のパス部分を使用
          }
        } catch {}
      }
      // APIを呼び出してSNSリンクを追加
      const response = await fetch('/api/corporate-member/links/sns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: link.platform,
          username: username, // 抽出したユーザー名または元の値を使用
          url: link.url,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの追加に失敗しました');
      }
      // 成功メッセージを表示
      toast.success(`${link.platform}のリンクを追加しました`);
      // ページをリロード（更新を反映するため）
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'SNSリンクの追加に失敗しました');
    }
  };

  // SNS設定ページにリンクする関数（編集用）
  const navigateToSnsSettings = (platform: string) => {
    // プラットフォームコードをURLエンコード
    const encodedPlatform = encodeURIComponent(platform);
    // 現在のリンク管理ページへのパスを返す（ハッシュ付き）
    return `/dashboard/corporate-member/links#add-sns-${encodedPlatform}`;
  };

  return (
    <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <HiOfficeBuilding className="mr-2 h-5 w-5 text-gray-600" />
          法人SNSリンク連携
        </h2>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        法人で指定されたSNSリンクです。設定が必要な項目があります。
      </p>

      {corporateSnsLinks.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
          <p className="text-blue-700 text-sm">
            現在、法人で指定されたSNSリンクはありません。法人管理者にお問い合わせください。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {corporateSnsLinks.map((link) => {
            const status = getSetupStatus(link);
            const statusColor =
              status === 'set'
                ? 'bg-green-100 text-green-700'
                : link.isRequired
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700';
            const statusIcon =
              status === 'set' ? (
                <HiCheck className="h-4 w-4" />
              ) : link.isRequired ? (
                <HiExclamation className="h-4 w-4" />
              ) : (
                <HiInformationCircle className="h-4 w-4" />
              );
            const statusText =
              status === 'set' ? '設定済み' : link.isRequired ? '必須・未設定' : '推奨・未設定';

            return (
              <div
                key={link.id}
                className="border rounded-md p-3 sm:p-4"
                style={{ borderColor: `${corporatePrimary}20` }}
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
                    style={{ backgroundColor: `${corporatePrimary}15` }}
                  >
                    <ImprovedSnsIcon
                      platform={link.platform as SnsPlatform}
                      color="original"
                      size={24}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h3 className="font-medium text-sm sm:text-base">
                        {getDisplayName(link.platform)}
                      </h3>
                      <div
                        className={`px-2 py-0.5 rounded-full text-xs flex items-center ${statusColor}`}
                      >
                        {statusIcon}
                        <span className="ml-1">{statusText}</span>
                      </div>
                      {link.isRequired && (
                        <div className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs">
                          必須
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                      {status === 'set' ? (
                        // 設定済みの場合は編集リンク
                        <Link href={navigateToSnsSettings(link.platform)}>
                          <Button variant="corporate" style={{ backgroundColor: corporatePrimary }}>
                            設定を変更
                          </Button>
                        </Link>
                      ) : (
                        // 未設定の場合は直接追加ボタン
                        <Button
                          variant="corporate"
                          style={{ backgroundColor: corporatePrimary }}
                          onClick={() => handleAddSns(link)}
                        >
                          設定する
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}