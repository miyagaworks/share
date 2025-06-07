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
  maxSizeKB?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// react-easy-cropがない場合のフォールバック用簡易クロッパー
const SimpleCropper = ({
  image,
  onComplete,
  onCancel,
}: {
  image: string;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // モバイル判定と初期化
  useState(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  });

  // 画像ロード時の処理（中央配置と縦横比設定）
  const handleImageLoad = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(aspectRatio);

    // 画像を中央に配置
    const containerSize = 300;
    const initialImageSize = containerSize; // 初期サイズは300px
    const imageWidth = initialImageSize;
    const imageHeight = initialImageSize / aspectRatio;

    // 中央配置のための座標計算
    const centerX = (containerSize - imageWidth) / 2;
    const centerY = (containerSize - imageHeight) / 2;

    setCrop({ x: centerX, y: centerY });
    setZoom(1);
    setImageLoaded(true);
  };

  // タッチ間距離の計算
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
    );
  };

  // タッチの中心点計算
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // マウスイベント（PC用）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;

    const deltaX = e.clientX - lastPosition.x;
    const deltaY = e.clientY - lastPosition.y;

    setCrop((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ホイールイベント（PC用ズーム）
  const handleWheel = (e: React.WheelEvent) => {
    if (isMobile) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, prev * delta)); // 無限拡大（制限なし）
  };

  // タッチイベント（モバイル用）
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1) {
      // 単一タッチ - ドラッグ開始
      setIsDragging(true);
      const center = getTouchCenter(touches);
      setLastPosition({ x: center.x, y: center.y });
    } else if (touches.length === 2) {
      // 2本指 - ピンチズーム開始
      setIsDragging(false);
      const distance = getTouchDistance(touches);
      setInitialTouchDistance(distance);
      setInitialZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1 && isDragging) {
      // 単一タッチ - ドラッグ
      const center = getTouchCenter(touches);
      const deltaX = center.x - lastPosition.x;
      const deltaY = center.y - lastPosition.y;

      setCrop((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setLastPosition({ x: center.x, y: center.y });
    } else if (touches.length === 2 && initialTouchDistance) {
      // 2本指 - ピンチズーム
      const distance = getTouchDistance(touches);
      const scaleChange = distance / initialTouchDistance;
      const newZoom = Math.max(0.1, initialZoom * scaleChange); // 無限拡大
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setInitialTouchDistance(null);
  };

  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // 300x300の容器で200x200の円形切り抜き
    const containerSize = 300;
    const cropSize = 200;
    const cropRadius = cropSize / 2;
    const containerCenter = containerSize / 2;

    // 出力キャンバスを200x200に設定
    canvas.width = cropSize;
    canvas.height = cropSize;

    // 白い背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropSize, cropSize);

    // 円形クリッピングパス
    ctx.save();
    ctx.beginPath();
    ctx.arc(cropRadius, cropRadius, cropRadius, 0, Math.PI * 2);
    ctx.clip();

    // 画像の実際の表示サイズを計算（縦横比固定）
    const imgDisplayWidth = containerSize * zoom;
    const imgDisplayHeight = imgDisplayWidth / imageAspectRatio;

    // 切り抜き範囲の計算
    const scaleX = img.naturalWidth / imgDisplayWidth;
    const scaleY = img.naturalHeight / imgDisplayHeight;

    const sourceX = (containerCenter - cropRadius - crop.x) * scaleX;
    const sourceY = (containerCenter - cropRadius - crop.y) * scaleY;
    const sourceSize = cropSize * scaleX;

    // 画像を描画（縦横比を完全に保持）
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, cropSize, cropSize);

    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onComplete(croppedDataUrl);
  }, [crop, zoom, onComplete, imageLoaded, imageAspectRatio]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">画像を調整</h3>

        <div className="relative mb-4">
          <div
            ref={containerRef}
            className="relative w-[300px] h-[300px] mx-auto border border-gray-300 overflow-hidden bg-gray-100 cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={image}
              alt="編集中の画像"
              className="absolute select-none pointer-events-none"
              style={{
                width: `${300 * zoom}px`,
                height: `${(300 * zoom) / imageAspectRatio}px`, // 縦横比完全固定
                left: `${crop.x}px`,
                top: `${crop.y}px`,
              }}
              onLoad={handleImageLoad}
              draggable={false}
            />

            {/* 円形オーバーレイ */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle 100px at 150px 150px, transparent 100px, rgba(255, 255, 255, 0.8) 101px)`,
              }}
            >
              <div
                className="absolute border-2 border-blue-500 rounded-full"
                style={{
                  left: 50,
                  top: 50,
                  width: 200,
                  height: 200,
                }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-2 text-center">
            {isMobile
              ? 'ドラッグで移動、2本指でピンチズーム（無制限）'
              : 'ドラッグで移動、ホイールまたはスライダーで拡大縮小（無制限）'}
          </p>
        </div>

        {/* PC用スライダー */}
        {!isMobile && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">拡大・縮小</label>
            <input
              type="range"
              min="0.1"
              max="50"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1x</span>
              <span>現在: {zoom.toFixed(1)}x</span>
              <span>50x+</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            適用
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    if (file.size > maxSizeKB * 1024) {
      toast.error(`ファイルサイズは${maxSizeKB / 1024}MB以下にしてください`);
      return;
    }

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

  const handleCropComplete = (croppedImage: string) => {
    onChange(croppedImage);
    setShowEditor(false);
    setOriginalImage(null);
  };

  const handleCropCancel = () => {
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
      <SimpleCropper
        image={originalImage}
        onComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
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