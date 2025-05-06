// components/ui/ImageUpload.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
  maxSizeKB?: number; // サイズ制限をプロパティで設定可能に
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  maxSizeKB = 1024, // デフォルト1MB
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像圧縮関数（オプション）
  const compressImage = useCallback(async (file: File, maxWidth = 800): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Imageオブジェクト生成
      const img = document.createElement('img');
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) return reject(new Error('画像読み込みエラー'));

        img.onload = () => {
          // サイズ調整（必要な場合のみ）
          const width = img.width;
          const height = img.height;

          // 既に小さい画像は圧縮しない
          if (width <= maxWidth) {
            return resolve(file as Blob);
          }

          // サイズ調整
          const canvas = document.createElement('canvas');
          const ratio = maxWidth / width;
          canvas.width = maxWidth;
          canvas.height = height * ratio;

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas contextエラー'));

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 圧縮した画像を返却
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('画像圧縮エラー'));
            },
            'image/jpeg',
            0.85, // 品質調整（85%）
          );
        };

        img.onerror = () => reject(new Error('画像読み込みエラー'));
        img.src = e.target.result as string;
      };

      reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // ファイルサイズチェック
    if (file.size > maxSizeKB * 1024) {
      toast.error(`ファイルサイズは${maxSizeKB / 1024}MB以下にしてください`);
      return;
    }

    // ファイル形式チェック
    if (!/^image\/(jpeg|png|jpg)$/.test(file.type)) {
      toast.error('JPGまたはPNG形式の画像をアップロードしてください');
      return;
    }

    setIsUploading(true);

    try {
      // 画像圧縮（大きい画像の場合のみ）
      const compressedFile = await compressImage(file);

      // FileReaderでファイルをBase64に変換
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onChange(event.target.result);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('画像の読み込みに失敗しました');
        setIsUploading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch {
      // エラー変数を使用せずcatchブロックを記述
      toast.error('画像処理に失敗しました');
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative w-18 h-18 rounded-full border border-input bg-background flex items-center justify-center cursor-pointer overflow-hidden transition-all',
        disabled && 'opacity-50 cursor-not-allowed',
        value ? 'bg-transparent' : 'bg-muted',
        className,
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {isUploading ? (
        <div className="text-sm text-muted-foreground">アップロード中...</div>
      ) : value ? (
        <>
          <Image
            src={value}
            alt="プロフィール画像"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 120px" // レスポンシブ対応
            loading="lazy" // 遅延読み込み
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            <button
              type="button"
              onClick={handleRemove}
              className="text-white text-xs bg-red-500 hover:bg-red-600 rounded-full p-1 px-2"
            >
              削除
            </button>
          </div>
        </>
      ) : (
        <div className="text-3xl font-semibold text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}
    </div>
  );
}