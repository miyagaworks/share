// components/dashboard/QrCodeClient.tsx
'use client';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaImage, FaCode } from 'react-icons/fa';
// QRコードの色オプション
const QR_COLOR_OPTIONS = [
  { id: 'black', name: 'Black', value: '#000000' },
  { id: 'darkGray', name: 'Dark gray', value: '#333333' },
  { id: 'mediumGray', name: 'Light gray', value: '#555555' },
];
interface QrCodeClientProps {
  profileUrl: string;
}
export function QrCodeClient({ profileUrl }: QrCodeClientProps) {
  const [size] = useState(250); // 固定サイズに設定
  const [selectedColor, setSelectedColor] = useState(QR_COLOR_OPTIONS[0].id);
  const qrRef = useRef<HTMLDivElement>(null);
  // 選択された色のオブジェクトを取得
  const colorOption =
    QR_COLOR_OPTIONS.find((option) => option.id === selectedColor) || QR_COLOR_OPTIONS[0];
  const qrColor = colorOption.value;
  const bgColor = 'white';
  // ダークモード対応（白い背景で囲む）
  const qrStyle = {
    width: size,
    height: size,
    backgroundColor: bgColor,
    padding: 16,
    borderRadius: 8,
    margin: '0 auto',
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
          downloadLink.download = 'share-qrcode.png';
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
      downloadLink.download = 'share-qrcode.svg';
      downloadLink.click();
      // ブロブURLの解放
      URL.revokeObjectURL(svgUrl);
      // 追加した白背景要素を削除（表示上の問題を防ぐ）
      svg.removeChild(rect);
      toast.success('QRコード（SVG）をダウンロードしました');
    } catch (error) {
      toast.error('QRコードのダウンロードに失敗しました');
    }
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
      <div className="mt-4">
        <label className="text-sm font-medium block mb-2">QRコードの色</label>
        <div className="grid grid-cols-3 gap-2">
          {QR_COLOR_OPTIONS.map((option) => (
            <div key={option.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => setSelectedColor(option.id)}
                className="h-16 rounded-md transition-colors flex items-center justify-center"
                style={{
                  backgroundColor:
                    option.id === 'black'
                      ? '#000000'
                      : option.id === 'darkGray'
                        ? '#333333'
                        : '#555555',
                }}
              >
                <span
                  className={`text-white text-center ${selectedColor === option.id ? 'font-bold' : 'font-normal'}`}
                >
                  {option.name}
                </span>
              </button>
              {selectedColor === option.id && (
                <div
                  className="h-1 mt-1 rounded-full mx-auto"
                  style={{
                    backgroundColor: option.value,
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
          className="flex-1 flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-800 text-white"
          onClick={downloadQrAsPng}
        >
          <FaImage className="h-4 w-4" />
          <span className="font-bold">PNG</span>
          <span style={{ fontSize: '0.75rem', margin: '0 -6px' }}>（画像用）</span>
        </Button>
        <Button
          className="flex-1 flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-800 text-white"
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
