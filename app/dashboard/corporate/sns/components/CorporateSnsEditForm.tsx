// app/dashboard/corporate/sns/components/CorporateSnsEditForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { SNS_METADATA, type SnsPlatform } from '@/types/sns';
import { SnsGuideModalWithDescription } from '@/components/shared/SnsGuideModalWithDescription';
import { toast } from 'react-hot-toast';
import { HiQuestionMarkCircle } from 'react-icons/hi';
import { CorporateSnsLink } from '../types';
import { updateCorporateSnsLink } from '@/actions/corporateSns';
import { handleApiError, simplifyLineUrl } from '../utils';

interface CorporateSnsEditFormProps {
  link: CorporateSnsLink;
  onCancel: () => void;
  onSuccess: (updatedLink: CorporateSnsLink) => void;
}

export function CorporateSnsEditForm({ link, onCancel, onSuccess }: CorporateSnsEditFormProps) {
  const [username, setUsername] = useState(link.username || '');
  const [url, setUrl] = useState(link.url);
  const [isRequired, setIsRequired] = useState(link.isRequired);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const platform = link.platform as SnsPlatform;
  const isLineLink = platform === 'line';
  const isOfficialLineLink = platform === 'official-line';

  // プラットフォームがガイドをサポートしているかどうかを確認
  const hasGuide = [
    'line',
    'official-line',
    'instagram',
    'facebook',
    'youtube',
    'x',
    'tiktok',
  ].includes(platform);

  // ユーザー名変更時にURLを自動生成（LINE以外）
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLineLink || isOfficialLineLink) return;

    const newUsername = e.target.value;
    setUsername(newUsername);

    if (platform && newUsername) {
      const metadata = SNS_METADATA[platform];
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

  // 保存処理
  const handleSubmit = async () => {
    if (!url) {
      toast.error('URLを入力してください');
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
      const result = await updateCorporateSnsLink(link.id, {
        username,
        url: finalUrl,
        isRequired,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`${SNS_METADATA[platform].name}のリンクを更新しました`);

      // 型変換して渡す
      const linkWithStringDates: CorporateSnsLink = {
        ...result.link!,
        createdAt: result.link!.createdAt.toString(),
        updatedAt: result.link!.updatedAt.toString(),
      };

      onSuccess(linkWithStringDates);
    } catch (error) {
      console.error('SNSリンク更新エラー:', error);
      toast.error(handleApiError(error, '法人共通SNSリンクの更新に失敗しました'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-white w-full max-w-full">
      <DialogHeader>
        <DialogTitle>法人共通SNSリンクを追加</DialogTitle>
        <DialogDescription>法人共通のSNSリンク設定を行います。</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        {/* LINEの場合はURL入力のみ */}
        {isLineLink || isOfficialLineLink ? (
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              disabled={isSubmitting}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {SNS_METADATA[platform]?.placeholderText || 'ユーザー名'}
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
            <Input
              value={username}
              onChange={handleUsernameChange}
              placeholder={SNS_METADATA[platform]?.placeholderText || 'ユーザー名'}
              disabled={isSubmitting}
            />
            {platform === 'instagram' && (
              <p className="mt-1 text-xs text-gray-500">@を省いたユーザー名を入力してください</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="editIsRequired"
            className="h-4 w-4 text-blue-600 rounded"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            disabled={isSubmitting}
          />
          <label htmlFor="editIsRequired" className="ml-2 text-sm text-gray-700">
            全ユーザーに必須（ユーザーが削除できなくなります）
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          type="button"
          disabled={!url || isSubmitting || (!(isLineLink || isOfficialLineLink) && !username)}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
              更新中...
            </div>
          ) : (
            '更新'
          )}
        </Button>
      </div>

      {/* SNSガイドモーダル */}
      <SnsGuideModalWithDescription
        platform={platform}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </DialogContent>
  );
}