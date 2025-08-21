// components/one-tap-seal/AddressSearchInput.tsx
'use client';
import { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { normalizePostalCode, validatePostalCode } from '@/lib/one-tap-seal/qr-slug-manager';

interface AddressSearchResult {
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  fullAddress: string;
}

interface AddressSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressFound: (address: AddressSearchResult) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function AddressSearchInput({
  value,
  onChange,
  onAddressFound,
  disabled = false,
  placeholder = '123-4567',
  className,
}: AddressSearchInputProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearched, setLastSearched] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 郵便番号の入力処理
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const normalizedValue = normalizePostalCode(e.target.value);
      onChange(normalizedValue);
      setError(null); // 入力時にエラーをクリア
    },
    [onChange],
  );

  // 住所検索実行
  const performSearch = useCallback(async () => {
    if (!validatePostalCode(value)) {
      setError('正しい郵便番号を入力してください（例: 123-4567）');
      return;
    }

    // 同じ郵便番号を連続検索することを防ぐ
    if (value === lastSearched) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setLastSearched(value);

    try {
      const response = await fetch(`/api/address/search?zipcode=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (data.success && data.address) {
        onAddressFound(data.address);
      } else {
        setError(data.error || '住所が見つかりませんでした');
      }
    } catch (err) {
      console.error('住所検索エラー:', err);
      setError('住所検索に失敗しました。しばらく後でお試しください。');
    } finally {
      setIsSearching(false);
    }
  }, [value, lastSearched, onAddressFound]);

  // Enterキーでの検索
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    },
    [performSearch],
  );

  // 検索ボタンクリック
  const handleSearchClick = useCallback(() => {
    performSearch();
  }, [performSearch]);

  // フォーカス時の処理
  const handleFocus = useCallback(() => {
    setError(null);
  }, []);

  const isValidZipcode = validatePostalCode(value);
  const canSearch = isValidZipcode && !isSearching && !disabled;

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={`${className} ${error ? 'border-red-500' : ''}`}
            maxLength={8}
            aria-label="郵便番号"
            aria-describedby={error ? 'zipcode-error' : undefined}
          />
        </div>

        <Button
          variant="outline"
          onClick={handleSearchClick}
          disabled={!canSearch}
          className="shrink-0 px-3"
          type="button"
          aria-label="住所を検索"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-1 hidden sm:inline">検索</span>
        </Button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div id="zipcode-error" className="flex items-center text-xs text-red-600">
          <AlertCircle className="h-3 w-3 mr-1 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ヘルプテキスト */}
      {!error && (
        <div className="flex items-center text-xs text-gray-500">
          <MapPin className="h-3 w-3 mr-1 shrink-0" />
          <span>
            {value
              ? isValidZipcode
                ? '検索ボタンを押すか、Enterキーで住所を検索します'
                : 'ハイフンを含む7桁の郵便番号を入力してください'
              : '郵便番号を入力すると住所を自動検索できます'}
          </span>
        </div>
      )}

      {/* 検索中のメッセージ */}
      {isSearching && (
        <div className="flex items-center text-xs text-blue-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          <span>住所を検索しています...</span>
        </div>
      )}
    </div>
  );
}

// ヘルパーコンポーネント: 郵便番号フォーマットガイド
export function PostalCodeGuide() {
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <p className="font-medium">郵便番号の入力について:</p>
      <ul className="ml-2 space-y-0.5">
        <li>• 7桁の数字で入力してください</li>
        <li>• ハイフンは自動で挿入されます</li>
        <li>• 例: 1234567 → 123-4567</li>
      </ul>
    </div>
  );
}

// ヘルパーコンポーネント: 検索結果プレビュー
interface AddressPreviewProps {
  address: AddressSearchResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AddressPreview({ address, onConfirm, onCancel }: AddressPreviewProps) {
  return (
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 mb-1">検索結果</p>
          <p className="text-sm text-green-800">
            〒{address.zipcode}
            <br />
            {address.fullAddress}
          </p>
        </div>
        <div className="flex space-x-2 ml-3">
          <Button size="sm" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button size="sm" onClick={onConfirm}>
            使用する
          </Button>
        </div>
      </div>
    </div>
  );
}