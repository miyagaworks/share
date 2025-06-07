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
  scale: number;
}

interface TouchInfo {
  x: number;
  y: number;
  distance?: number;
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
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState<TouchInfo | null>(null);
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // エディターのサイズ定数
  const EDITOR_SIZE = 300;
  const CROP_SIZE = 200;
  const CROP_RADIUS = CROP_SIZE / 2;
  const EDITOR_CENTER = EDITOR_SIZE / 2;

  // モバイル判定
  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

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

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(aspectRatio);

    // 最小スケールを小さく設定（画像の一部でも切り抜けるように）
    const minScale = 0.1;

    // 初期スケールは1.0に設定
    const initialScale = 1.0;

    // 初期位置は中央に配置
    setCropArea({
      x: 0,
      y: 0,
      scale: initialScale,
    });
  }, []);

  // 画像の表示サイズを計算
  const getImageDisplaySize = useCallback(
    (scale: number) => {
      const displayWidth = EDITOR_SIZE * scale;
      const displayHeight = displayWidth / imageAspectRatio;
      return { width: displayWidth, height: displayHeight };
    },
    [imageAspectRatio],
  );

  // タッチ間の距離を計算
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
    );
  };

  // タッチの中心点を計算
  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
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

  // 画像位置を制限する関数（最小限の制限のみ）
  const constrainPosition = (x: number, y: number, scale: number): { x: number; y: number } => {
    const { width: imgDisplayWidth, height: imgDisplayHeight } = getImageDisplaySize(scale);

    // 切り抜き範囲が完全に画像の外に出ないよう最小限の制限
    // 画像の端が切り抜き範囲の中心を超えないようにする
    const minX = -(imgDisplayWidth - CROP_RADIUS);
    const maxX = EDITOR_SIZE - CROP_RADIUS;
    const minY = -(imgDisplayHeight - CROP_RADIUS);
    const maxY = EDITOR_SIZE - CROP_RADIUS;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  // デスクトップ用マウスイベント
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastTouch || !imageRef.current || isMobile) return;

    const deltaX = e.clientX - lastTouch.x;
    const deltaY = e.clientY - lastTouch.y;

    setCropArea((prev) => {
      const newPos = constrainPosition(prev.x + deltaX, prev.y + deltaY, prev.scale);
      return { ...prev, ...newPos };
    });

    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastTouch(null);
  };

  // モバイル用タッチイベント
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1) {
      // 単一タッチ - ドラッグ開始
      setIsDragging(true);
      const center = getTouchCenter(touches);
      setLastTouch({ x: center.x, y: center.y });
    } else if (touches.length === 2) {
      // 2本指 - ピンチ開始
      setIsDragging(false);
      const distance = getTouchDistance(touches);
      const center = getTouchCenter(touches);
      setInitialTouchDistance(distance);
      setInitialScale(cropArea.scale);
      setLastTouch({ x: center.x, y: center.y, distance });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1 && isDragging && lastTouch) {
      // 単一タッチ - ドラッグ
      const center = getTouchCenter(touches);
      const deltaX = center.x - lastTouch.x;
      const deltaY = center.y - lastTouch.y;

      setCropArea((prev) => {
        const newPos = constrainPosition(prev.x + deltaX, prev.y + deltaY, prev.scale);
        return { ...prev, ...newPos };
      });

      setLastTouch({ x: center.x, y: center.y });
    } else if (touches.length === 2 && initialTouchDistance && lastTouch) {
      // 2本指 - ピンチズーム
      const distance = getTouchDistance(touches);

      const scaleChange = distance / initialTouchDistance;
      const minScale = 0.1; // 最小スケールを小さく設定
      const maxScale = 10; // 最大スケールを大きく設定
      const newScale = Math.max(minScale, Math.min(maxScale, initialScale * scaleChange));

      setCropArea((prev) => {
        const newPos = constrainPosition(prev.x, prev.y, newScale);
        return { ...prev, scale: newScale, ...newPos };
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLastTouch(null);
    setInitialTouchDistance(null);
  };

  // デスクトップ用スケール変更
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMobile) return;
    const newScale = parseFloat(e.target.value);
    setCropArea((prev) => {
      const newPos = constrainPosition(prev.x, prev.y, newScale);
      return { ...prev, scale: newScale, ...newPos };
    });
  };

  const cropImage = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = imageRef.current;

    // 出力サイズを200x200に設定
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    // 背景を白で塗りつぶし
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    // 丸いクリッピングパスを作成
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_RADIUS, CROP_RADIUS, CROP_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    // 画像の表示サイズを計算
    const { width: imgDisplayWidth, height: imgDisplayHeight } = getImageDisplaySize(
      cropArea.scale,
    );

    // 切り抜き範囲の左上角の座標（画像上での位置）
    const cropLeft = EDITOR_CENTER - CROP_RADIUS - cropArea.x;
    const cropTop = EDITOR_CENTER - CROP_RADIUS - cropArea.y;

    // 元画像でのピクセル比率
    const scaleX = img.naturalWidth / imgDisplayWidth;
    const scaleY = img.naturalHeight / imgDisplayHeight;

    // 元画像での切り抜き範囲
    const sourceX = cropLeft * scaleX;
    const sourceY = cropTop * scaleY;
    const sourceSize = CROP_SIZE * scaleX; // 正方形なのでwidthとheightは同じ

    // 画像を描画（元画像の縦横比を保持）
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize * (scaleY / scaleX),
      0,
      0,
      CROP_SIZE,
      CROP_SIZE,
    );

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [cropArea, CROP_SIZE, CROP_RADIUS, EDITOR_CENTER, getImageDisplaySize]);

  const handleApply = () => {
    const croppedImage = cropImage();
    if (croppedImage) {
      onChange(croppedImage);
      setShowEditor(false);
      setOriginalImage(null);
      setCropArea({ x: 0, y: 0, scale: 1 });
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setOriginalImage(null);
    setCropArea({ x: 0, y: 0, scale: 1 });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  };

  if (showEditor && originalImage) {
    const { width: imgDisplayWidth, height: imgDisplayHeight } = getImageDisplaySize(
      cropArea.scale,
    );
    const minScale = 0.1;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">画像を調整</h3>

          <div className="relative mb-4">
            <div
              ref={editorRef}
              className="relative w-[300px] h-[300px] mx-auto border border-gray-300 overflow-hidden touch-none bg-gray-100"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={originalImage}
                alt="編集中の画像"
                className="absolute select-none"
                style={{
                  width: `${imgDisplayWidth}px`,
                  height: `${imgDisplayHeight}px`,
                  left: `${cropArea.x}px`,
                  top: `${cropArea.y}px`,
                  touchAction: 'none',
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />

              {/* 白いオーバーレイと丸い透明部分 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle ${CROP_RADIUS}px at ${EDITOR_CENTER}px ${EDITOR_CENTER}px, transparent ${CROP_RADIUS}px, rgba(255, 255, 255, 0.8) ${CROP_RADIUS + 1}px)`,
                }}
              >
                {/* 丸い境界線 */}
                <div
                  className="absolute border-2 border-blue-500 rounded-full"
                  style={{
                    left: EDITOR_CENTER - CROP_RADIUS,
                    top: EDITOR_CENTER - CROP_RADIUS,
                    width: CROP_SIZE,
                    height: CROP_SIZE,
                  }}
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-2 text-center">
              {isMobile
                ? 'ドラッグで移動、2本指でピンチズーム'
                : 'ドラッグで移動、スライダーで拡大縮小'}
            </p>
          </div>

          {/* デスクトップ用スライダー */}
          {!isMobile && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">拡大・縮小</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.05"
                value={cropArea.scale}
                onChange={handleScaleChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1x</span>
                <span>10x</span>
              </div>
            </div>
          )}

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