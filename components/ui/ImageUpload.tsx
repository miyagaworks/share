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
}

// 画像リサイズユーティリティ関数
const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8,
): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // アスペクト比を保持しながらリサイズ
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 高品質なリサイズのための設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// HEIC検出とサポートチェック
const isHeicFile = (file: File): boolean => {
  return file.type === 'image/heic' || 
         file.type === 'image/heif' ||
         file.name.toLowerCase().endsWith('.heic') ||
         file.name.toLowerCase().endsWith('.heif');
};

// HEIC変換の試行（ブラウザサポートがある場合のみ動作）
const tryConvertHeic = async (file: File): Promise<File | null> => {
  try {
    // まず、ブラウザがHEICを直接処理できるか試す
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        // 成功した場合、画像を変換
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              const convertedFile = new File(
                [blob], 
                file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(convertedFile);
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.9
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      
      // タイムアウト設定（3秒）
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(null);
      }, 3000);
      
      img.src = url;
    });
  } catch {
    return null;
  }
};

// 改良版クロッパーコンポーネント
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

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // プルトゥリフレッシュ防止（モバイルのみ）
  useEffect(() => {
    if (!isMobile) return;

    const originalStyle = {
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
      position: document.body.style.position,
      height: document.body.style.height,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.position = 'fixed';
    document.body.style.height = '100%';
    document.body.style.width = '100%';

    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;

    const preventRefresh = (e: TouchEvent) => {
      if (e.touches.length > 1) return;

      if (window.scrollY === 0) {
        const touch = e.touches[0];
        const startY = touch.clientY;

        const handleTouchMove = (moveEvent: TouchEvent) => {
          const currentTouch = moveEvent.touches[0];
          const deltaY = currentTouch.clientY - startY;

          if (deltaY > 0) {
            try {
              moveEvent.preventDefault();
            } catch (error) {
              // エラーを無視
            }
          }
        };

        const handleTouchEnd = () => {
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
    };

    document.addEventListener('touchstart', preventRefresh, { passive: false });

    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.touchAction = originalStyle.touchAction;
      document.body.style.position = originalStyle.position;
      document.body.style.height = originalStyle.height;
      document.body.style.width = '';
      document.body.style.top = '';

      window.scrollTo(0, scrollY);
      document.removeEventListener('touchstart', preventRefresh);
    };
  }, [isMobile]);

  // 画像ロード時の処理（長方形対応）
  const handleImageLoad = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(aspectRatio);

    const containerSize = 300;

    // 初期ズームを計算（円形クロップエリアに収まるように）
    const cropSize = 200;
    let initialZoomValue = 1;

    // 画像が横長の場合
    if (aspectRatio > 1) {
      // 高さを基準にズーム
      initialZoomValue = cropSize / (containerSize / aspectRatio);
    } else {
      // 縦長または正方形の場合、幅を基準にズーム
      initialZoomValue = cropSize / containerSize;
    }

    // 最小ズームは0.7に設定（画像全体が見えるように）
    initialZoomValue = Math.max(0.7, initialZoomValue);

    setZoom(initialZoomValue);

    // 画像を中央に配置
    const imageWidth = containerSize * initialZoomValue;
    const imageHeight = imageWidth / aspectRatio;

    const centerX = (containerSize - imageWidth) / 2;
    const centerY = (containerSize - imageHeight) / 2;

    setCrop({ x: centerX, y: centerY });
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
    e.preventDefault();
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;
    e.preventDefault();

    const deltaX = e.clientX - lastPosition.x;
    const deltaY = e.clientY - lastPosition.y;

    setCrop((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // ホイールイベント（PC用ズーム）
  const handleWheel = (e: React.WheelEvent) => {
    if (isMobile) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(50, Math.max(0.1, zoom * delta));

    adjustZoomFromCenter(newZoom);
  };

  // 青い円の中心基準でズーム調整
  const adjustZoomFromCenter = (newZoom: number) => {
    const containerSize = 300;
    const cropCenterX = containerSize / 2;
    const cropCenterY = containerSize / 2;

    const currentWidth = containerSize * zoom;
    const currentHeight = currentWidth / imageAspectRatio;

    const newWidth = containerSize * newZoom;
    const newHeight = newWidth / imageAspectRatio;

    const currentRelativeX = (cropCenterX - crop.x) / currentWidth;
    const currentRelativeY = (cropCenterY - crop.y) / currentHeight;

    const newX = cropCenterX - currentRelativeX * newWidth;
    const newY = cropCenterY - currentRelativeY * newHeight;

    setCrop({ x: newX, y: newY });
    setZoom(newZoom);
  };

  // タッチイベント（モバイル用）
  const handleTouchStart = (e: React.TouchEvent) => {
    // preventDefaultは呼び出さない（passive対応）
    const touches = e.touches;

    if (touches.length === 1) {
      setIsDragging(true);
      const center = getTouchCenter(touches);
      setLastPosition({ x: center.x, y: center.y });
    } else if (touches.length === 2) {
      setIsDragging(false);
      const distance = getTouchDistance(touches);
      setInitialTouchDistance(distance);
      setInitialZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // preventDefaultは呼び出さない（passive対応）
    const touches = e.touches;

    if (touches.length === 1 && isDragging) {
      const center = getTouchCenter(touches);
      const deltaX = center.x - lastPosition.x;
      const deltaY = center.y - lastPosition.y;

      setCrop((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setLastPosition({ x: center.x, y: center.y });
    } else if (touches.length === 2 && initialTouchDistance) {
      const distance = getTouchDistance(touches);
      const scaleChange = distance / initialTouchDistance;
      const newZoom = Math.min(50, Math.max(0.1, initialZoom * scaleChange));

      adjustZoomFromCenter(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // preventDefaultは呼び出さない（passive対応）
    setIsDragging(false);
    setInitialTouchDistance(null);
  };

  // スライダー変更ハンドラー
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = Number(e.target.value);
    adjustZoomFromCenter(newZoom);
  };

  // クロップ処理（長方形対応）
  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    const containerSize = 300;
    const cropSize = 200;
    const cropRadius = cropSize / 2;
    const containerCenter = containerSize / 2;

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

    const imgDisplayWidth = containerSize * zoom;
    const imgDisplayHeight = imgDisplayWidth / imageAspectRatio;

    const scaleX = img.naturalWidth / imgDisplayWidth;
    const scaleY = img.naturalHeight / imgDisplayHeight;

    const sourceX = (containerCenter - cropRadius - crop.x) * scaleX;
    const sourceY = (containerCenter - cropRadius - crop.y) * scaleY;

    const sourceSizeX = cropSize * scaleX;
    const sourceSizeY = cropSize * scaleY;

    // アンチエイリアシング改善
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, sourceX, sourceY, sourceSizeX, sourceSizeY, 0, 0, cropSize, cropSize);

    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onComplete(croppedDataUrl);
  }, [crop, zoom, onComplete, imageLoaded, imageAspectRatio]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
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
              style={{
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={image}
                alt="編集中の画像"
                className="absolute select-none pointer-events-none"
                style={{
                  width: `${300 * zoom}px`,
                  height: `${(300 * zoom) / imageAspectRatio}px`,
                  left: `${crop.x}px`,
                  top: `${crop.y}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
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
                ? 'ドラッグで移動、2本指でピンチズーム'
                : 'ドラッグで移動、ホイールまたはスライダーで拡大縮小'}
            </p>
          </div>

          {/* ズームスライダー（PC・モバイル両方表示） */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">拡大・縮小</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={zoom}
              onChange={handleSliderChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1x</span>
              <span>現在: {zoom.toFixed(1)}x</span>
              <span>10x</span>
            </div>
          </div>

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
    </div>
  );
};

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  maxSizeKB = 5120, // 5MBに増加
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

    let file = e.target.files[0];
    setIsUploading(true);

    try {
      // HEICファイルの検出と処理
      if (isHeicFile(file)) {
        // まずブラウザでの変換を試みる
        const convertedFile = await tryConvertHeic(file);

        if (convertedFile) {
          file = convertedFile;
          toast.success('HEIC形式をJPEGに変換しました');
        } else {
          // ブラウザで変換できない場合の処理
          toast.error(
            'お使いのブラウザではHEIC形式をサポートしていません。\n' +
              '画像を事前にJPGまたはPNG形式に変換してからアップロードしてください。\n\n' +
              '【変換方法】\n' +
              '• iPhone/iPad: 画像を「写真」アプリで開き...',
            { duration: 10000 },
          );
          setIsUploading(false);

          // ファイル入力をリセット
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }

      // サポートされているフォーマットチェック
      if (!/^image\/(jpeg|png|jpg)$/.test(file.type)) {
        toast.error('JPGまたはPNG形式の画像をアップロードしてください');
        setIsUploading(false);
        return;
      }

      // 大きい画像の自動リサイズ
      let processedImage: string;

      if (file.size > maxSizeKB * 1024) {
        toast.loading('画像をリサイズしています...', { id: 'resize' });

        try {
          // 最大2000x2000にリサイズ、品質80%
          const { dataUrl } = await resizeImage(file, 2000, 2000, 0.8);
          processedImage = dataUrl;
          toast.success('画像をリサイズしました', { id: 'resize' });
        } catch (error) {
          toast.error('画像のリサイズに失敗しました', { id: 'resize' });
          setIsUploading(false);
          return;
        }
      } else {
        // そのまま読み込み
        const reader = new FileReader();
        processedImage = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
              resolve(event.target.result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }

      setOriginalImage(processedImage);
      setShowEditor(true);
      setIsUploading(false);
    } catch (error) {
      toast.error('画像処理に失敗しました');
      setIsUploading(false);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onChange(croppedImage);
    setShowEditor(false);
    setOriginalImage(null);
    toast.success('画像を設定しました');
  };

  const handleCropCancel = () => {
    setShowEditor(false);
    setOriginalImage(null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
    toast.success('画像を削除しました');
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
        'relative w-32 h-32 rounded-full border-2 border-input bg-background flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary',
        disabled && 'opacity-50 cursor-not-allowed',
        value ? 'bg-transparent' : 'bg-muted',
        className,
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/jpg"
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
            sizes="(max-width: 768px) 100vw, 128px"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            <button
              type="button"
              onClick={handleRemove}
              className="text-white text-xs bg-red-500 hover:bg-red-600 rounded-full px-3 py-1"
            >
              削除
            </button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted-foreground"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-xs text-muted-foreground mt-2">クリックして選択</p>
        </div>
      )}
    </div>
  );
}