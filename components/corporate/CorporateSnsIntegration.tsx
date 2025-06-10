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
  if (Object.keys(SNS_METADATA).includes(platformCode)) {
    return SNS_METADATA[platformCode as SnsPlatform].name;
  }
  return platformCode;
};

export function CorporateSnsIntegration({
  corporateSnsLinks,
  personalSnsLinks,
  tenantData,
}: CorporateSnsIntegrationProps) {
  const corporatePrimary = tenantData?.primaryColor || tenantData?.corporatePrimary || '#1E3A8A';

  const getSetupStatus = (corporateLink: CorporateSnsLink) => {
    const personalLink = personalSnsLinks.find((link) => link.platform === corporateLink.platform);
    return personalLink ? 'set' : 'missing';
  };

  const handleAddSns = async (link: CorporateSnsLink) => {
    try {
      let username = link.username;
      if (!username && link.url) {
        try {
          const url = new URL(link.url);
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (link.platform === 'YouTube' && pathParts[0]?.startsWith('@')) {
            username = pathParts[0].substring(1);
          } else if (pathParts.length > 0) {
            username = pathParts[pathParts.length - 1];
          }
        } catch {}
      }

      const response = await fetch('/api/corporate-member/links/sns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: link.platform,
          username: username,
          url: link.url,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの追加に失敗しました');
      }

      toast.success(`${link.platform}のリンクを追加しました`);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'SNSリンクの追加に失敗しました');
    }
  };

  const navigateToSnsSettings = (platform: string) => {
    const encodedPlatform = encodeURIComponent(platform);
    return `/dashboard/corporate-member/links#add-sns-${encodedPlatform}`;
  };

  return (
    <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center mb-2">
          <HiOfficeBuilding className="mr-2 h-5 w-5 text-gray-600 flex-shrink-0" />
          <span className="min-w-0">法人SNSリンク連携</span>
        </h2>
        <p className="text-sm text-gray-600">
          法人で指定されたSNSリンクです。設定が必要な項目があります。
        </p>
      </div>

      {corporateSnsLinks.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
          <p className="text-blue-700 text-sm">
            現在、法人で指定されたSNSリンクはありません。法人管理者にお問い合わせください。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className="border rounded-md p-3"
                style={{ borderColor: `${corporatePrimary}20` }}
              >
                {/* モバイル最適化: 縦積みレイアウト */}
                <div className="space-y-3">
                  {/* ヘッダー部分 */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${corporatePrimary}15` }}
                    >
                      <ImprovedSnsIcon
                        platform={link.platform as SnsPlatform}
                        color="original"
                        size={24}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">
                          {getDisplayName(link.platform)}
                        </h3>
                        {link.isRequired && (
                          <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                            必須
                          </span>
                        )}
                      </div>
                      <div
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${statusColor}`}
                      >
                        {statusIcon}
                        <span className="ml-1">{statusText}</span>
                      </div>
                    </div>
                  </div>

                  {/* URL表示部分 - モバイル対応 */}
                  <div className="pl-13">
                    <div className="text-xs text-gray-500 break-all">{link.url}</div>
                  </div>

                  {/* ボタン部分 - レスポンシブ対応・統一スタイル */}
                  <div className="flex justify-start sm:justify-end pl-13">
                    {status === 'set' ? (
                      <Link href={navigateToSnsSettings(link.platform)} className="inline-block">
                        <Button
                          variant="corporate"
                          className="h-[48px] text-base sm:text-sm w-auto sm:w-auto"
                        >
                          設定変更
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="corporate"
                        className="h-[48px] text-base sm:text-sm w-full sm:w-auto"
                        onClick={() => handleAddSns(link)}
                      >
                        設定する
                      </Button>
                    )}
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