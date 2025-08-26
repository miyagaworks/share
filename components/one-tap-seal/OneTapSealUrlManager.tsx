// components/one-tap-seal/OneTapSealUrlManager.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import {
  Link,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Settings,
} from 'lucide-react';
import { isValidProfileSlug } from '@/lib/one-tap-seal/profile-slug-manager'; // qr-slug-manager → profile-slug-manager に変更

interface ProfileSlugValidationResult {
  // QrSlugValidationResult → ProfileSlugValidationResult に変更
  isValid: boolean;
  isAvailable: boolean;
  isOwn?: boolean;
  message: string;
  profileUrl?: string; // qrCodeId → profileUrl に変更
}

interface OneTapSealUrlManagerProps {
  profileSlug: string; // qrSlug → profileSlug に変更
  onProfileSlugChange: (slug: string) => void; // onQrSlugChange → onProfileSlugChange に変更
  disabled?: boolean;
  userProfileSlug?: string; // userQrSlug → userProfileSlug に変更
  userName?: string;
}

export function OneTapSealUrlManager({
  profileSlug, // qrSlug → profileSlug に変更
  onProfileSlugChange, // onQrSlugChange → onProfileSlugChange に変更
  disabled = false,
  userProfileSlug, // userQrSlug → userProfileSlug に変更
  userName,
}: OneTapSealUrlManagerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [validationResult, setValidationResult] = useState<ProfileSlugValidationResult | null>(
    null,
  );

  // スラッグの検証
  const validateSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setValidationResult({
        isValid: false,
        isAvailable: false,
        message: '3文字以上入力してください',
      });
      return;
    }

    if (!isValidProfileSlug(slug)) {
      // isValidQrSlug → isValidProfileSlug に変更
      setValidationResult({
        isValid: false,
        isAvailable: false,
        message: '英小文字、数字、ハイフンのみ使用できます',
      });
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(
        `/api/one-tap-seal/validate-profile?slug=${encodeURIComponent(slug)}`, // validate-qr → validate-profile に変更
      );
      const data = await response.json();

      setValidationResult({
        isValid: data.isValid,
        isAvailable: data.isAvailable || data.isOwn,
        isOwn: data.isOwn,
        message:
          data.message ||
          (data.isValid && (data.isAvailable || data.isOwn) ? '使用可能です' : '使用できません'),
        profileUrl: data.profileUrl, // qrCodeId → profileUrl に変更
      });
    } catch (error) {
      console.error('スラッグ検証エラー:', error);
      setValidationResult({
        isValid: false,
        isAvailable: false,
        message: '検証に失敗しました',
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 入力変更ハンドラ
  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      onProfileSlugChange(value); // onQrSlugChange → onProfileSlugChange に変更
      setValidationResult(null);
    },
    [onProfileSlugChange],
  );

  // デバウンス付きの検証実行
  useEffect(() => {
    if (!profileSlug) {
      // qrSlug → profileSlug に変更
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(() => {
      validateSlug(profileSlug); // qrSlug → profileSlug に変更
    }, 500);

    return () => clearTimeout(timer);
  }, [profileSlug, validateSlug]); // qrSlug → profileSlug に変更

  // 既存プロフィールスラッグの使用
  const useExistingSlug = useCallback(() => {
    if (userProfileSlug) {
      // userQrSlug → userProfileSlug に変更
      onProfileSlugChange(userProfileSlug); // onQrSlugChange → onProfileSlugChange, userQrSlug → userProfileSlug に変更
      toast.success('既存のプロフィールスラッグを設定しました'); // QRスラッグ → プロフィールスラッグ に変更
    }
  }, [userProfileSlug, onProfileSlugChange]); // userQrSlug, onQrSlugChange → userProfileSlug, onProfileSlugChange に変更

  // URLのコピー
  const copyUrl = useCallback(() => {
    const url = `https://app.sns-share.com/${profileSlug}`; // /qr/ を削除
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success('URLをコピーしました');
      })
      .catch(() => {
        toast.error('URLのコピーに失敗しました');
      });
  }, [profileSlug]);

  // プレビューURLを開く
  const openPreview = useCallback(() => {
    const url = `https://app.sns-share.com/${profileSlug}`; // /qr/ を削除
    window.open(url, '_blank');
  }, [profileSlug]);

  // QRコードデザイナーページを開く
  const openQrDesigner = useCallback(() => {
    const url = '/dashboard/share';
    window.open(url, '_blank');
  }, []);

  const canUseSlug = validationResult?.isValid && validationResult.isAvailable;
  const isOwnSlug = validationResult?.isOwn;

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <Link className="h-5 w-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold">NFCタグURL設定</h3>{' '}
        {/* QRコードURL → NFCタグURL に変更 */}
      </div>

      <div className="space-y-4">
        {/* プロフィールURL設定案内 */}
        {!userProfileSlug && ( // userQrSlug → userProfileSlug に変更
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-yellow-900">
                  プロフィールURLの設定が必要です
                </p>{' '}
                {/* カスタム → プロフィール に変更 */}
                <p className="text-xs text-yellow-700 mt-1">
                  ワンタップシールを注文するには、まずプロフィール設定でプロフィールURLを設定してください。{' '}
                  {/* QRコードデザイナー → プロフィール設定、カスタム → プロフィール に変更 */}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openQrDesigner}
                  className="mt-2 h-7 px-3 border-yellow-300 text-yellow-800 hover:bg-yellow-100 w-full sm:w-auto text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  プロフィール設定で設定 {/* QRコードデザイナー → プロフィール設定 に変更 */}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 既存プロフィールスラッグの利用オプション */}
        {userProfileSlug &&
          userProfileSlug !== profileSlug && ( // userQrSlug → userProfileSlug に変更
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    既存のプロフィールスラッグを使用
                  </p>{' '}
                  {/* QRスラッグ → プロフィールスラッグ に変更 */}
                  <p className="text-xs text-blue-700">app.sns-share.com/{userProfileSlug}</p>{' '}
                  {/* /qr/ を削除、userQrSlug → userProfileSlug に変更 */}
                </div>
                <Button size="sm" variant="outline" onClick={useExistingSlug} disabled={disabled}>
                  使用する
                </Button>
              </div>
            </div>
          )}

        {/* URL入力 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            プロフィールURL <span className="text-red-500">*</span>{' '}
            {/* カスタム → プロフィール に変更 */}
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              app.sns-share.com/ {/* /qr/ を削除 */}
            </span>
            <Input
              type="text"
              value={profileSlug} // qrSlug → profileSlug に変更
              onChange={handleSlugChange}
              placeholder="yourname"
              disabled={disabled}
              className={`rounded-l-none ${
                validationResult?.isValid === false
                  ? 'border-red-500'
                  : canUseSlug
                    ? 'border-green-500'
                    : ''
              }`}
              minLength={3}
              maxLength={20}
            />
          </div>

          {/* 検証ステート表示 */}
          <div className="mt-2 space-y-2">
            {isChecking ? (
              <div className="flex items-center text-xs text-blue-600">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                チェック中...
              </div>
            ) : validationResult ? (
              <div
                className={`flex items-center text-xs ${
                  canUseSlug ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {canUseSlug ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {validationResult.message}
                {isOwnSlug && <span className="ml-1 text-blue-600">(既に使用中)</span>}
              </div>
            ) : profileSlug.length > 0 && profileSlug.length < 3 ? ( // qrSlug → profileSlug に変更
              <div className="flex items-center text-xs text-gray-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                3文字以上入力してください
              </div>
            ) : null}

            {/* URL プレビューとアクション */}
            {canUseSlug && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-600">
                  完成URL: https://app.sns-share.com/{profileSlug}{' '}
                  {/* /qr/ を削除、qrSlug → profileSlug に変更 */}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyUrl}
                  className="h-5 px-1"
                  disabled={disabled}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={openPreview}
                  className="h-5 px-1"
                  disabled={disabled}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 使用規則 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">URL作成ルール:</p>
          <ul className="ml-2 space-y-0.5">
            <li>• 3～20文字で入力してください</li>
            <li>• 英小文字、数字、ハイフン（-）のみ使用可能</li>
            <li>• 他のユーザーが使用中のURLは選択できません</li>
            <li>• 一度設定したURLは変更できませんのでご注意ください</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}