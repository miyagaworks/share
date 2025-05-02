// components/corporate/QrCodeGenerator.tsx
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaImage, FaCode } from 'react-icons/fa';

// QRコードの色オプション
const QR_COLOR_OPTIONS = [
  { id: 'primary', name: '法人カラー', value: '' }, // 法人プライマリーカラー（動的に設定）
  { id: 'black', name: 'ブラック', value: '#000000' },
  { id: 'darkGray', name: 'ダークグレー', value: '#333333' },
];

interface QrCodeGeneratorProps {
  profileUrl: string;
  primaryColor: string | null;
  // tenantNameパラメータを削除
}

export function QrCodeGenerator({ profileUrl, primaryColor }: QrCodeGeneratorProps) {
  const [size, setSize] = useState(200); // サイズを調整可能に
  const [selectedColor, setSelectedColor] = useState('primary');
  const qrRef = useRef<HTMLDivElement>(null);

  // 法人カラーを設定
  const corporateColor = primaryColor || '#1E3A8A';

  // 選択された色のオブジェクトを取得
  const colorOption =
    QR_COLOR_OPTIONS.find((option) => option.id === selectedColor) || QR_COLOR_OPTIONS[0];
  const qrColor = colorOption.id === 'primary' ? corporateColor : colorOption.value;
  const bgColor = 'white';

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

  // URLをクリップボードにコピー
  const copyUrlToClipboard = () => {
    navigator.clipboard
      .writeText(profileUrl)
      .then(() => toast.success('URLをコピーしました'))
      .catch(() => toast.error('URLのコピーに失敗しました'));
  };

  return (
    <div className="space-y-4">
      <div ref={qrRef} className="flex justify-center">
        <div style={qrStyle}>
          <QRCodeSVG
            value={profileUrl}
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
                  backgroundColor: option.id === 'primary' ? corporateColor : option.value,
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
                    backgroundColor: option.id === 'primary' ? corporateColor : option.value,
                    width: '50%',
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        <Button
          variant="corporate" // スタイルの適用（インラインスタイルの代わりに）
          className="flex-1 flex items-center gap-2 justify-center"
          onClick={downloadQrAsPng}
        >
          <FaImage className="h-4 w-4" />
          <span className="font-bold">PNG</span>
          <span style={{ fontSize: '0.75rem', margin: '0 -6px' }}>（画像用）</span>
        </Button>

        <Button
          variant="corporate" // スタイルの適用（インラインスタイルの代わりに）
          className="flex-1 flex items-center gap-2 justify-center"
          onClick={downloadQrAsSvg}
        >
          <FaCode className="h-4 w-4" />
          <span className="font-bold">SVG</span>
          <span style={{ fontSize: '0.75rem', margin: '0 -6px' }}>（印刷用）</span>
        </Button>
      </div>

      <Button
        variant="corporateOutline" // 紺色のボーダーと白背景に紺色のテキスト
        className="w-full mt-2 flex items-center justify-center gap-2"
        onClick={copyUrlToClipboard}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        URLをコピー
      </Button>

      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>※SVG形式は高解像度印刷に最適です</p>
      </div>
    </div>
  );
}