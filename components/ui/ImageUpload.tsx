// components/ui/ImageUpload.tsx
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
  maxSizeKB?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  maxSizeKB = 1024,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setOriginalImage(event.target.result);
          setShowEditor(true);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('画像の読み込みに失敗しました');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('画像処理に失敗しました');
      setIsUploading(false);
    }
  };

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const containerSize = 300; // エディター表示領域のサイズ
    const scale = Math.min(containerSize / img.naturalWidth, containerSize / img.naturalHeight);

    setCropArea({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      scale: scale,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropArea.x,
      y: e.clientY - cropArea.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const img = imageRef.current;
    const containerSize = 300;
    const maxX = img.naturalWidth * cropArea.scale - cropArea.width;
    const maxY = img.naturalHeight * cropArea.scale - cropArea.height;

    const newX = Math.max(0, Math.min(maxX, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(maxY, e.clientY - dragStart.y));

    setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setCropArea((prev) => ({ ...prev, scale: newScale }));
  };

  const cropImage = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = imageRef.current;

    // 出力サイズを200x200に設定
    canvas.width = 200;
    canvas.height = 200;

    // 元画像から切り抜く領域を計算
    const sourceX = cropArea.x / cropArea.scale;
    const sourceY = cropArea.y / cropArea.scale;
    const sourceWidth = cropArea.width / cropArea.scale;
    const sourceHeight = cropArea.height / cropArea.scale;

    // 背景を白で塗りつぶし
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);

    // 画像を描画
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 200, 200);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, [cropArea]);

  const handleApply = () => {
    const croppedImage = cropImage();
    if (croppedImage) {
      onChange(croppedImage);
      setShowEditor(false);
      setOriginalImage(null);
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setOriginalImage(null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  };

  if (showEditor && originalImage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">画像を調整</h3>

          <div className="relative mb-4">
            <div
              className="relative w-[300px] h-[300px] mx-auto border border-gray-300 overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={originalImage}
                alt="編集中の画像"
                className="absolute"
                style={{
                  width: `${100 * cropArea.scale}%`,
                  height: 'auto',
                  left: `-${cropArea.x}px`,
                  top: `-${cropArea.y}px`,
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />

              {/* クロップ領域 */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-0 border border-white"></div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">拡大・縮小</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={cropArea.scale}
              onChange={handleScaleChange}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              適用
            </button>
          </div>

          {/* 非表示のcanvas要素 */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
  }

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
            sizes="(max-width: 768px) 100vw, 120px"
            loading="lazy"
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