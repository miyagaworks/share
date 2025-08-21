// components/one-tap-seal/ShippingAddressForm.tsx
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { MapPin, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { type EnhancedShippingAddress } from '@/types/one-tap-seal';
import { normalizePostalCode, validatePostalCode } from '@/lib/one-tap-seal/qr-slug-manager';

interface ShippingAddressFormProps {
  address: EnhancedShippingAddress;
  onAddressChange: (address: EnhancedShippingAddress) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ShippingAddressForm({
  address,
  onAddressChange,
  disabled = false,
  autoFocus = false,
}: ShippingAddressFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    postalCode?: string;
    address?: string;
    building?: string;
    companyName?: string;
    recipientName?: string;
  }>({});

  // 入力値の更新ハンドラ（useCallbackで最適化）
  const updateField = useCallback(
    (field: keyof EnhancedShippingAddress, value: string) => {
      onAddressChange({
        ...address,
        [field]: value,
      });

      // 入力時にエラーをクリア
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [address, onAddressChange, validationErrors],
  );

  // 郵便番号の正規化と更新
  const handlePostalCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const normalizedValue = normalizePostalCode(e.target.value);
      updateField('postalCode', normalizedValue);
      setSearchResult(null); // 郵便番号変更時に検索結果をクリア
    },
    [updateField],
  );

  // 住所検索実行
  const handleAddressSearch = useCallback(async () => {
    if (!validatePostalCode(address.postalCode)) {
      setSearchResult({
        success: false,
        message: '正しい郵便番号を入力してください（例: 123-4567）',
      });
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const response = await fetch(
        `/api/address/search?zipcode=${encodeURIComponent(address.postalCode)}`,
      );
      const data = await response.json();

      if (data.success && data.address) {
        // 住所を自動入力
        updateField('address', data.address.fullAddress);
        setSearchResult({
          success: true,
          message: '住所を自動入力しました',
        });
        toast.success('住所を自動入力しました');
      } else {
        setSearchResult({
          success: false,
          message: data.error || '住所が見つかりませんでした',
        });
      }
    } catch (error) {
      console.error('住所検索エラー:', error);
      setSearchResult({
        success: false,
        message: '住所検索に失敗しました。手動で入力してください。',
      });
    } finally {
      setIsSearching(false);
    }
  }, [address.postalCode, updateField]);

  // バリデーション実行（useMemoで最適化）
  const validationResult = useMemo(() => {
    const errors: typeof validationErrors = {};

    if (!address.postalCode) {
      errors.postalCode = '郵便番号を入力してください';
    } else if (!validatePostalCode(address.postalCode)) {
      errors.postalCode = '正しい郵便番号を入力してください（例: 123-4567）';
    }

    if (!address.address.trim()) {
      errors.address = '住所を入力してください';
    } else if (address.address.trim().length < 5) {
      errors.address = '住所を正しく入力してください';
    }

    if (!address.recipientName.trim()) {
      errors.recipientName = 'お届け先名を入力してください';
    } else if (address.recipientName.trim().length < 1) {
      errors.recipientName = '正しい名前を入力してください';
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0,
    };
  }, [address.postalCode, address.address, address.recipientName]);

  // バリデーションエラーを状態に反映（useEffectで最適化）
  useEffect(() => {
    setValidationErrors(validationResult.errors);
  }, [validationResult.errors]);

  // Enterキーでの住所検索
  const handlePostalCodeKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddressSearch();
      }
    },
    [handleAddressSearch],
  );

  // 自動フォーカス
  useEffect(() => {
    if (autoFocus) {
      const firstInput = document.querySelector('input[name="postalCode"]') as HTMLInputElement;
      firstInput?.focus();
    }
  }, [autoFocus]);

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold">配送先情報</h3>
      </div>

      <div className="space-y-4">
        {/* 郵便番号 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            郵便番号 <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                name="postalCode"
                type="text"
                value={address.postalCode}
                onChange={handlePostalCodeChange}
                onKeyPress={handlePostalCodeKeyPress}
                placeholder="123-4567"
                disabled={disabled}
                className={validationErrors.postalCode ? 'border-red-500' : ''}
                maxLength={8}
              />
              {validationErrors.postalCode && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.postalCode}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleAddressSearch}
              disabled={disabled || isSearching || !validatePostalCode(address.postalCode)}
              className="shrink-0"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">住所検索</span>
            </Button>
          </div>

          {/* 検索結果メッセージ */}
          {searchResult && (
            <div
              className={`mt-2 text-xs flex items-center ${
                searchResult.success ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {searchResult.success ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {searchResult.message}
            </div>
          )}
        </div>

        {/* 住所（番地まで） */}
        <div>
          <label className="block text-sm font-medium mb-2">
            住所（番地まで） <span className="text-red-500">*</span>
          </label>
          <Input
            name="address"
            type="text"
            value={address.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="東京都渋谷区渋谷1-1-1"
            disabled={disabled}
            className={validationErrors.address ? 'border-red-500' : ''}
          />
          {validationErrors.address && (
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {validationErrors.address}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            都道府県・市区町村・町名・番地まで入力してください
          </p>
        </div>

        {/* マンション名・部屋番号 */}
        <div>
          <label className="block text-sm font-medium mb-2">マンション名・部屋番号</label>
          <Input
            name="building"
            type="text"
            value={address.building || ''}
            onChange={(e) => updateField('building', e.target.value)}
            placeholder="○○マンション 101号室"
            disabled={disabled}
            className={validationErrors.building ? 'border-red-500' : ''}
          />
          {validationErrors.building && (
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {validationErrors.building}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            マンション・アパート名がある場合は部屋番号と一緒に入力してください
          </p>
        </div>

        {/* 会社名（任意） */}
        <div>
          <label className="block text-sm font-medium mb-2">会社名</label>
          <Input
            name="companyName"
            type="text"
            value={address.companyName || ''}
            onChange={(e) => updateField('companyName', e.target.value)}
            placeholder="株式会社○○"
            disabled={disabled}
            className={validationErrors.companyName ? 'border-red-500' : ''}
          />
          {validationErrors.companyName && (
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {validationErrors.companyName}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            法人でご注文の場合は会社名を入力してください（任意）
          </p>
        </div>

        {/* お届け先名 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            お届け先名 <span className="text-red-500">*</span>
          </label>
          <Input
            name="recipientName"
            type="text"
            value={address.recipientName}
            onChange={(e) => updateField('recipientName', e.target.value)}
            placeholder="山田 太郎"
            disabled={disabled}
            className={validationErrors.recipientName ? 'border-red-500' : ''}
          />
          {validationErrors.recipientName && (
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {validationErrors.recipientName}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            受け取り可能な方のお名前をご入力ください（苗字と名前の間に半角スペースを入れてください）
          </p>
        </div>
      </div>

      {/* 配送に関する注意事項 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">配送について</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• クリックポスト（追跡可能）でお届けします</li>
          <li>• ポストに投函されます（対面受取不要）</li>
          <li>• 配送料は全国一律185円（税込）です</li>
          <li>• 発送後1-3営業日でお届け予定です</li>
        </ul>
      </div>

      {/* フォーム状態表示 */}
      {!disabled && (
        <div className="mt-4 text-xs text-gray-500">
          {validationResult.isValid ? (
            <span className="text-green-600 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              配送先情報の入力が完了しました
            </span>
          ) : (
            <span className="text-gray-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              必須項目を全て入力してください
            </span>
          )}
        </div>
      )}
    </Card>
  );
}