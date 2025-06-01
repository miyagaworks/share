// components/dashboard/PersonalShareSettings.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { HiEye, HiEyeOff, HiInformationCircle, HiClock, HiUsers } from 'react-icons/hi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
interface ShareSettingsProps {
  initialValues: {
    isPublic: boolean;
    slug: string | null;
    views: number;
    lastAccessed: string | null;
  };
  baseUrl: string;
  isLoading: boolean;
}
export function PersonalShareSettings({ initialValues, baseUrl, isLoading }: ShareSettingsProps) {
  // フォーム状態
  const [isPublic, setIsPublic] = useState(initialValues.isPublic);
  const [slug, setSlug] = useState(initialValues.slug || '');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  // 初期値が変更された場合、フォームを更新
  useEffect(() => {
    setIsPublic(initialValues.isPublic);
    setSlug(initialValues.slug || '');
  }, [initialValues]);
  // 変更検知
  useEffect(() => {
    const isChanged = isPublic !== initialValues.isPublic || slug !== (initialValues.slug || '');
    setFormChanged(isChanged);
  }, [isPublic, slug, initialValues]);
  // スラッグのバリデーション
  const validateSlug = (value: string) => {
    if (!value.trim()) {
      setSlugError('URLスラッグは必須です');
      return false;
    }
    if (value.length < 3) {
      setSlugError('URLスラッグは3文字以上で入力してください');
      return false;
    }
    if (value.length > 30) {
      setSlugError('URLスラッグは30文字以内で入力してください');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setSlugError('URLスラッグは英数字、ハイフン、アンダースコアのみ使用可能です');
      return false;
    }
    setSlugError(null);
    return true;
  };
  // スラッグ変更ハンドラー
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSlug(value);
    validateSlug(value);
    setFormChanged(true);
  };
  // 保存処理の修正（デバッグログ追加）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // スラッグのバリデーション
    if (!validateSlug(slug)) {
      return;
    }
    try {
      setIsSaving(true);
      const requestData = { isPublic, slug };
      const response = await fetch('/api/profile/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '共有設定の更新に失敗しました');
      }
      await response.json();
      toast.success('共有設定を更新しました');
      setFormChanged(false);
      // 成功時にページをリフレッシュして最新データを取得
      window.location.reload();
    } catch (error) {
      if (error instanceof Error && error.message.includes('既に使用されています')) {
        setSlugError('このURLスラッグは既に使用されています。別の値を入力してください。');
      } else {
        toast.error(error instanceof Error ? error.message : '共有設定の更新に失敗しました');
      }
      setFormChanged(true);
    } finally {
      setIsSaving(false);
    }
  };
  // 最終アクセス日時のフォーマット
  const formatLastAccessed = (dateString: string | null) => {
    if (!dateString) return '未アクセス';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 公開・非公開設定 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">公開設定</label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            className={`flex items-center justify-center px-4 py-2 rounded-md border w-full ${
              isPublic
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-gray-50 border-gray-300 text-gray-500'
            }`}
            onClick={() => setIsPublic(true)}
          >
            <HiEye className="mr-2 h-5 w-5" />
            公開
          </button>
          <button
            type="button"
            className={`flex items-center justify-center px-4 py-2 rounded-md border w-full ${
              !isPublic
                ? 'bg-red-50 border-red-500 text-red-700'
                : 'bg-gray-50 border-gray-300 text-gray-500'
            }`}
            onClick={() => setIsPublic(false)}
          >
            <HiEyeOff className="mr-2 h-5 w-5" />
            非公開
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {isPublic
            ? '公開設定にすると、URLを知っている人なら誰でもあなたのプロフィールを閲覧できます。'
            : '非公開設定にすると、プロフィールは外部から閲覧できなくなります。'}
        </p>
      </div>
      {/* URLスラッグ設定 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">カスタムURL</label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
          <span className="bg-gray-100 px-3 py-2 rounded-t-md sm:rounded-l-md sm:rounded-tr-none border border-b-0 sm:border-b sm:border-r-0 border-gray-300 text-gray-500 text-center sm:text-left">
            {baseUrl}/
          </span>
          <Input
            value={slug}
            onChange={handleSlugChange}
            className="rounded-b-md sm:rounded-l-none sm:rounded-r-md"
            placeholder="yourname"
            disabled={isLoading || isSaving}
            error={slugError || undefined}
          />
        </div>
        {slugError ? (
          <p className="text-sm text-red-600">{slugError}</p>
        ) : (
          <p className="text-sm text-gray-500">
            プロフィールページのURLを設定します。英数字、ハイフン、アンダースコアのみ使用可能です。
          </p>
        )}
      </div>
      {/* アクセス統計情報 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <HiUsers className="h-5 w-5 text-gray-600 flex-shrink-0" />
          <div>
            <div className="text-sm text-gray-500">総閲覧数</div>
            <div className="font-medium">{initialValues.views.toLocaleString()} 回</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HiClock className="h-5 w-5 text-gray-600 flex-shrink-0" />
          <div>
            <div className="text-sm text-gray-500">最終アクセス</div>
            <div className="font-medium">{formatLastAccessed(initialValues.lastAccessed)}</div>
          </div>
        </div>
      </div>
      {/* 個人利用に関する注意書き */}
      <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
        <div className="flex">
          <HiInformationCircle className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-700 text-justify">
              カスタムURLを設定することで、覚えやすいURLでプロフィールを共有できます。
              名刺やメール署名などに活用してください。
            </p>
          </div>
        </div>
      </div>
      {/* 送信ボタン */}
      <div className="flex justify-center sm:justify-end">
        <Button
          type="submit"
          disabled={!formChanged || isLoading || isSaving || !!slugError}
          loading={isSaving}
          loadingText="保存中..."
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
        >
          共有設定を保存
        </Button>
      </div>
    </form>
  );
}