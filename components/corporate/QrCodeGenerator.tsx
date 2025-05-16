// components/corporate/QrCodeGenerator.tsx
import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaImage, FaCode } from 'react-icons/fa';
import { HiEye } from 'react-icons/hi';

// QRコードの色オプション
const QR_COLOR_OPTIONS = [
  { id: 'corporate', name: '法人カラー', value: '' }, // 法人プライマリーカラー（動的に設定）
  { id: 'black', name: 'ブラック', value: '#000000' },
  { id: 'darkGray', name: 'ダークグレー', value: '#333333' },
];

interface QrCodeGeneratorProps {
  profileUrl: string;
  primaryColor: string | null;
  textColor?: string;
  qrCodeSlug?: string;
  onQrCodeSlugChange?: (slug: string) => void;
  onGenerateQrCode?: (slug: string) => Promise<void>;
  hideSlugInput?: boolean;
  hideGenerateButton?: boolean;
}

export function QrCodeGenerator({
  profileUrl,
  primaryColor: corporatePrimaryColor,
  textColor = '#FFFFFF',
  qrCodeSlug,
  onQrCodeSlugChange,
  onGenerateQrCode,
  hideSlugInput = false,
  hideGenerateButton = false,
}: QrCodeGeneratorProps) {
  const [size, setSize] = useState(200); // サイズを調整可能に
  const [selectedColor, setSelectedColor] = useState('corporate');
  const qrRef = useRef<HTMLDivElement>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 法人カラーを設定
  const corporateColor = corporatePrimaryColor || '#1E3A8A';

  // 選択された色のオブジェクトを取得
  const colorOption =
    QR_COLOR_OPTIONS.find((option) => option.id === selectedColor) || QR_COLOR_OPTIONS[0];
  const qrColor = colorOption.id === 'corporate' ? corporateColor : colorOption.value;
  const bgColor = 'white';

  // 内部スラグ状態
  const [internalSlug, setInternalSlug] = useState(qrCodeSlug || '');
  const [isSlugAvailable, setIsSlugAvailable] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isExistingQrCode, setIsExistingQrCode] = useState(false);

  // 外部から渡されたスラグが変更された場合、内部状態も更新
  useEffect(() => {
    if (qrCodeSlug && qrCodeSlug !== internalSlug) {
      setInternalSlug(qrCodeSlug);
      checkSlugAvailability(qrCodeSlug);
    }
  }, [qrCodeSlug, internalSlug]); // internalSlugを依存配列に追加

  // 初期表示時に生成済みURLを設定（もし既に存在する場合）
  useEffect(() => {
    if (internalSlug && internalSlug.length >= 3) {
      setGeneratedUrl(`${window.location.origin}/qr/${internalSlug}`);
    }
  }, [internalSlug]); // internalSlugを依存配列に追加

  // QRコードのスタイル
  const qrStyle = {
    width: size,
    height: size,
    backgroundColor: bgColor,
    padding: 16,
    borderRadius: 8,
    margin: '0 auto',
  };

  // サイズ調整
  const handleSizeChange = (increment: boolean) => {
    const newSize = increment ? size + 50 : size - 50;
    if (newSize >= 150 && newSize <= 400) {
      setSize(newSize);
    }
  };

  // カスタムURLスラグの利用可能性をチェック
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
      return;
    }

    setIsCheckingSlug(true);

    try {
      // APIエンドポイントを呼び出してスラグが利用可能かどうかをチェック
      const response = await fetch(`/api/qrcode/check-slug?slug=${slug}`);
      const data = await response.json();

      if (!data.available) {
        // 既に使用されているスラグ
        if (data.ownedByCurrentUser) {
          // 自分のQRコードの場合は編集可能とする
          setIsSlugAvailable(true);
          setIsExistingQrCode(true);
        } else {
          // 他のユーザーのスラグは使用不可
          setIsSlugAvailable(false);
          setIsExistingQrCode(false);
        }
      } else {
        // 新しいスラグは使用可能
        setIsSlugAvailable(true);
        setIsExistingQrCode(false);
      }
    } catch (err) {
      console.error('スラグチェックエラー:', err);
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // スラグ入力の変更を処理
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setInternalSlug(newSlug);

    // 親コンポーネントの変更ハンドラーがある場合は呼び出す
    if (onQrCodeSlugChange) {
      onQrCodeSlugChange(newSlug);
    }

    // 入力後にスラグの利用可能性をチェック
    if (newSlug.length >= 3) {
      checkSlugAvailability(newSlug);
    } else {
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
    }
  };

  // QRコードページ生成処理
  const handleGenerateQrCode = async () => {
    if (!internalSlug || internalSlug.length < 3) {
      toast.error('有効なURLスラグを入力してください');
      return;
    }

    if (!isSlugAvailable && !isExistingQrCode) {
      toast.error('このURLは既に使用されています');
      return;
    }

    setIsGenerating(true);

    try {
      // 外部提供の生成ハンドラーがある場合はそれを使用
      if (onGenerateQrCode) {
        await onGenerateQrCode(internalSlug);
      } else {
        // 自前の生成ロジック
        // QRコードページの設定データを準備
        const qrCodeData = {
          slug: internalSlug,
          template: 'simple',
          primaryColor: corporateColor,
          secondaryColor: corporateColor,
          accentColor: '#FFFFFF',
          textColor,
          userName: '',
          profileUrl,
        };

        const response = await fetch('/api/qrcode/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(qrCodeData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'QRコードページの作成に失敗しました');
        }

        const data = await response.json();
        console.log('QRコード作成成功:', data);
      }

      // 成功後の処理
      const fullUrl = `${window.location.origin}/qr/${internalSlug}`;
      setGeneratedUrl(fullUrl);
      toast.success(isExistingQrCode ? 'QRコードを更新しました' : 'QRコードを作成しました');
    } catch (error) {
      console.error('QRコード生成エラー:', error);
      toast.error(error instanceof Error ? error.message : 'QRコードページの作成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // PNGとしてダウンロード
  const downloadQrAsPng = () => {
    if (!qrRef.current) return;

    try {
      // SVGをキャンバスに描画してPNG化
      const svg = qrRef.current.querySelector('svg');
      if (!svg) {
        toast.error('QRコードが見つかりません');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svg);

      // キャンバスサイズを設定（余白を付ける）
      canvas.width = size + 32;
      canvas.height = size + 32;

      if (ctx) {
        // 背景を白く
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // SVGを画像に変換
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
          // 中央に配置
          ctx.drawImage(img, 16, 16, size, size);

          // ダウンロード
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = 'corporate-profile-qrcode.png';
          downloadLink.click();

          // ブロブURLの解放
          URL.revokeObjectURL(url);

          toast.success('QRコード（PNG）をダウンロードしました');
        };

        img.src = url;
      } else {
        toast.error('キャンバスの作成に失敗しました');
      }
    } catch (error) {
      toast.error('QRコードのダウンロードに失敗しました');
      console.error('Download failed:', error);
    }
  };

  // SVGとしてダウンロード
  const downloadQrAsSvg = () => {
    if (!qrRef.current) return;

    try {
      // SVG要素を取得
      const svg = qrRef.current.querySelector('svg');
      if (!svg) {
        toast.error('QRコードが見つかりません');
        return;
      }

      // SVGに白背景を追加（印刷時の透明背景問題を防ぐ）
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'white');
      svg.insertBefore(rect, svg.firstChild);

      // SVGデータを文字列化
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // ダウンロードリンクを作成
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'corporate-profile-qrcode.svg';
      downloadLink.click();

      // ブロブURLの解放
      URL.revokeObjectURL(svgUrl);

      // 追加した白背景要素を削除（表示上の問題を防ぐ）
      svg.removeChild(rect);

      toast.success('QRコード（SVG）をダウンロードしました');
    } catch (error) {
      toast.error('QRコードのダウンロードに失敗しました');
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* カスタムURLスラグ入力欄 - hideSlugInputがtrueの場合は非表示 */}
      {!hideSlugInput && (
        <div className="mb-4">
          <label className="text-sm font-medium block mb-2">QRコードページのURL</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              {typeof window !== 'undefined' ? window.location.origin : ''}/qr/
            </span>
            <input
              type="text"
              value={internalSlug}
              onChange={handleSlugChange}
              className="flex-1 rounded-r-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your-custom-url"
              minLength={3}
              maxLength={20}
            />
          </div>
          <div className="mt-1">
            {isCheckingSlug ? (
              <p className="text-xs text-gray-500">チェック中...</p>
            ) : internalSlug.length >= 3 ? (
              isExistingQrCode ? (
                <p className="text-xs text-amber-600">※ このURLは既に使用中です。更新されます</p>
              ) : isSlugAvailable ? (
                <p className="text-xs text-green-600">✓ このURLは利用可能です</p>
              ) : (
                <p className="text-xs text-red-600">
                  ✗ このURLは既に他のユーザーに使用されています
                </p>
              )
            ) : (
              <p className="text-xs text-gray-500">3文字以上入力してください</p>
            )}
          </div>
        </div>
      )}

      <div ref={qrRef} className="flex justify-center">
        <div style={qrStyle}>
          <QRCodeSVG
            value={
              generatedUrl ||
              (internalSlug.length >= 3
                ? `${window.location.origin}/qr/${internalSlug}`
                : profileUrl)
            }
            size={size - 32}
            fgColor={qrColor}
            bgColor={bgColor}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      <div className="flex justify-center items-center gap-2 mt-2">
        <Button
          variant="corporate"
          size="sm"
          onClick={() => handleSizeChange(false)}
          disabled={size <= 150}
        >
          -
        </Button>
        <span className="text-sm">サイズ: {size}px</span>
        <Button
          variant="corporate"
          size="sm"
          onClick={() => handleSizeChange(true)}
          disabled={size >= 400}
        >
          +
        </Button>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium block mb-2">QRコードの色</label>
        <div className="grid grid-cols-3 gap-2">
          {QR_COLOR_OPTIONS.map((option) => (
            <div key={option.id} className="flex flex-col">
              <Button
                type="button"
                onClick={() => setSelectedColor(option.id)}
                className={`h-16 flex items-center justify-center ${
                  selectedColor === option.id ? 'font-bold' : 'font-normal'
                }`}
                style={{
                  backgroundColor: option.id === 'corporate' ? corporateColor : option.value,
                  color: 'white',
                  border: 'none',
                }}
              >
                <span className="text-white text-center">{option.name}</span>
              </Button>
              {selectedColor === option.id && (
                <div
                  className="h-1 mt-1 rounded-full mx-auto"
                  style={{
                    backgroundColor: option.id === 'corporate' ? corporateColor : option.value,
                    width: '50%',
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* QRコード生成ボタン - hideGenerateButton が true の場合は非表示 */}
      {!hideGenerateButton && (
        <div className="mt-4">
          <Button
            variant="corporate"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGenerateQrCode}
            disabled={
              isGenerating || (!isSlugAvailable && !isExistingQrCode) || internalSlug.length < 3
            }
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {isExistingQrCode ? 'QRコードを更新中...' : 'QRコードを作成中...'}
              </>
            ) : (
              <>
                <HiEye className="h-4 w-4" />
                {isExistingQrCode ? 'QRコードを更新' : 'QRコードを作成'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* ダウンロードボタンは残す */}
      <div className="flex justify-center space-x-4 mt-4">
        <Button
          variant="corporate"
          className="flex-1 flex items-center gap-2 justify-center"
          onClick={downloadQrAsPng}
        >
          <FaImage className="h-4 w-4" />
          <span className="font-bold">PNG</span>
          <span style={{ fontSize: '0.75rem', margin: '0 -6px' }}>（画像用）</span>
        </Button>

        <Button
          variant="corporate"
          className="flex-1 flex items-center gap-2 justify-center"
          onClick={downloadQrAsSvg}
        >
          <FaCode className="h-4 w-4" />
          <span className="font-bold">SVG</span>
          <span style={{ fontSize: '0.75rem', margin: '0 -6px' }}>（印刷用）</span>
        </Button>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>※SVG形式は高解像度印刷に最適です</p>
      </div>
    </div>
  );
}