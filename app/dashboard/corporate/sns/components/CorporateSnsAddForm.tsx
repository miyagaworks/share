// app/dashboard/corporate/sns/components/CorporateSnsAddForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { SNS_METADATA, type SnsPlatform, SNS_PLATFORMS } from '@/types/sns';
import { SnsGuideModalWithDescription } from '@/components/shared/SnsGuideModalWithDescription';
import { toast } from 'react-hot-toast';
import { HiPlus, HiQuestionMarkCircle } from 'react-icons/hi';
import { CorporateSnsLink } from '../types';
import { addCorporateSnsLink } from '@/actions/corporateSns';
import { handleApiError, simplifyLineUrl } from '../utils';

interface CorporateSnsAddFormProps {
  existingLinks: CorporateSnsLink[];
  onCancel: () => void;
  onSuccess: (newLink: CorporateSnsLink) => void;
}

export function CorporateSnsAddForm({
  existingLinks,
  onCancel,
  onSuccess,
}: CorporateSnsAddFormProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ガイドモーダル用のステート
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 選択されたプラットフォームのメタデータを取得
  const selectedMetadata = selectedPlatform ? SNS_METADATA[selectedPlatform as SnsPlatform] : null;

  // LINE系のプラットフォームかどうか
  const isLineLink = selectedPlatform === 'line';
  const isOfficialLineLink = selectedPlatform === 'official-line';

  // プラットフォームがガイドをサポートしているかどうかを確認
  const hasGuide =
    selectedPlatform &&
    ['line', 'official-line', 'instagram', 'facebook', 'youtube', 'x', 'tiktok'].includes(
      selectedPlatform,
    );

  // プラットフォーム選択時の処理
  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    setUsername('');
    setUrl('');

    // プラットフォームごとのデフォルト値をセット
    if (platform === 'line' || platform === 'official-line') {
      setUrl('');
    } else {
      const metadata = SNS_METADATA[platform as SnsPlatform];
      if (metadata && metadata.baseUrl) {
        setUrl(metadata.baseUrl);
      }
    }
  };

  // ユーザー名変更時にURLを自動生成（LINE以外）
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLineLink || isOfficialLineLink) return;

    const newUsername = e.target.value;
    setUsername(newUsername);

    if (selectedPlatform && newUsername) {
      const metadata = SNS_METADATA[selectedPlatform as SnsPlatform];
      if (metadata && metadata.baseUrl) {
        setUrl(`${metadata.baseUrl}${newUsername}`);
      }
    }
  };

  // LINE URLの直接編集時の処理
  const handleLineUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // LINE URLからユーザー名部分を抽出して保存
    if (newUrl.includes('line.me/ti/p/')) {
      try {
        const urlObj = new URL(newUrl);
        const pathSegments = urlObj.pathname.split('/');
        // line.me/ti/p/の後の部分がユーザー名（ID）
        const lineId = pathSegments[pathSegments.length - 1];
        setUsername(lineId);
      } catch (error) {
        console.error('Invalid LINE URL', error);
      }
    }
  };

  // フォームリセット
  const resetForm = () => {
    setSelectedPlatform('');
    setUsername('');
    setUrl('');
    setIsRequired(false);
    setDescription('');
  };

  // 送信処理
  const handleSubmit = async () => {
    if (!selectedPlatform || !url) {
      toast.error('必須項目を入力してください');
      return;
    }

    // LINE以外でユーザー名が必要な場合に検証
    if (!isLineLink && !isOfficialLineLink && !username) {
      toast.error('ユーザー名を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);

      // LINE選択時はURLの簡略化を行う
      let finalUrl = url;
      if (isLineLink || isOfficialLineLink) {
        finalUrl = simplifyLineUrl(url);
      }

      // サーバーアクションを使用
      const result = await addCorporateSnsLink({
        platform: selectedPlatform,
        username,
        url: finalUrl,
        isRequired,
        description: description || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`${SNS_METADATA[selectedPlatform as SnsPlatform].name}のリンクを追加しました`);
      resetForm();

      // 型変換して渡す
      const linkWithStringDates: CorporateSnsLink = {
        ...result.link!,
        createdAt: result.link!.createdAt.toString(),
        updatedAt: result.link!.updatedAt.toString(),
      };

      onSuccess(linkWithStringDates);
    } catch (error) {
      console.error('SNSリンク追加エラー:', error);
      toast.error(handleApiError(error, '法人共通SNSリンクの追加に失敗しました'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // プレースホルダーテキストとラベルの取得
  const getLinePlaceholder = () => {
    if (isLineLink) {
      return 'https://line.me/ti/p/...';
    } else if (isOfficialLineLink) {
      return 'https://lin.ee/...';
    }
    return 'https://...';
  };

  const getLineLabel = () => {
    if (isLineLink) {
      return 'LINEのURL';
    } else if (isOfficialLineLink) {
      return '公式LINEのURL';
    }
    return 'URL';
  };

  return (
    <DialogContent className="sm:max-w-md bg-white w-full max-w-full">
      <DialogHeader>
        <DialogTitle>法人共通SNSリンクを追加</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            プラットフォーム <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SNS_PLATFORMS.map((platform) => {
              // 既に追加済みのプラットフォームは無効化
              const isDisabled = existingLinks.some((link) => link.platform === platform);

              return (
                <button
                  key={platform}
                  type="button"
                  className={`p-2 border rounded-md flex flex-col items-center justify-center ${
                    selectedPlatform === platform
                      ? 'border-blue-500 bg-blue-50'
                      : isDisabled
                        ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => !isDisabled && handlePlatformSelect(platform)}
                  disabled={isDisabled}
                >
                  <ImprovedSnsIcon platform={platform as SnsPlatform} size={24} />
                  <span className="text-xs mt-1">
                    {SNS_METADATA[platform as SnsPlatform]?.name || platform}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedPlatform && (
          <>
            {/* LINEの場合はURL入力のみ */}
            {isLineLink || isOfficialLineLink ? (
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    {getLineLabel()}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-blue-600"
                    onClick={() => setIsGuideOpen(true)}
                  >
                    <HiQuestionMarkCircle className="mr-1 h-4 w-4" />
                    URL取得方法
                  </Button>
                </div>
                <Input
                  value={url}
                  onChange={handleLineUrlChange}
                  placeholder={getLinePlaceholder()}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {isLineLink
                    ? 'LINEのURLは自動的に正規化されます'
                    : '公式LINE URLは自動的に正規化されます'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    {selectedMetadata?.placeholderText || 'ユーザー名'}
                  </label>
                  {hasGuide && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-blue-600"
                      onClick={() => setIsGuideOpen(true)}
                    >
                      <HiQuestionMarkCircle className="mr-1 h-4 w-4" />
                      URL取得方法
                    </Button>
                  )}
                </div>

                <div>
                  <Input
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder={selectedMetadata?.placeholderText || 'ユーザー名'}
                  />
                  {selectedPlatform === 'instagram' && (
                    <p className="mt-1 text-xs text-gray-500">
                      @を省いたユーザー名を入力してください
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このSNSアカウントの説明"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRequired"
                className="h-4 w-4 text-blue-600 rounded"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
              <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
                全ユーザーに必須（ユーザーが削除できなくなります）
              </label>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          type="button"
          disabled={
            !selectedPlatform ||
            !url ||
            (!(isLineLink || isOfficialLineLink) && !username) ||
            isSubmitting
          }
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
              追加中...
            </div>
          ) : (
            <>
              <HiPlus className="mr-2 h-4 w-4" />
              追加
            </>
          )}
        </Button>
      </div>

      {/* SNSガイドモーダル */}
      {selectedPlatform && (
        <SnsGuideModalWithDescription
          platform={selectedPlatform as SnsPlatform}
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      )}
    </DialogContent>
  );
}