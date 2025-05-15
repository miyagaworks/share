// components/qrcode/QrCodePreview.tsx
'use client';

import { useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaImage, FaCode } from 'react-icons/fa';
import { motion } from 'framer-motion';
import tinycolor from 'tinycolor2';

interface QrCodePreviewProps {
  profileUrl: string;
  userName: string;
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function QrCodePreview({
  profileUrl,
  userName,
  templateId,
  primaryColor,
  secondaryColor,
  accentColor,
}: QrCodePreviewProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrSize = 180;
  const bgColor = 'white';

  // 選択されたテンプレートに基づいてQRコードの色を決定
  const qrColor = useMemo(() => {
    switch (templateId) {
      case 'simple':
        return '#000000';
      case 'modern':
        return tinycolor(primaryColor).darken(10).toString();
      case 'bold':
        return '#000000';
      default:
        return '#000000';
    }
  }, [templateId, primaryColor]);

  // テンプレートに基づいたスタイルを取得
  const getTemplateStyle = (): React.CSSProperties => {
    // 色の明るさによってテキスト色を調整
    const getTextColor = (bgColor: string) => {
      return tinycolor(bgColor).isDark() ? '#FFFFFF' : '#000000';
    };

    // テンプレートに応じて設定を変更
    switch (templateId) {
      case 'simple':
        return {
          backgroundColor: bgColor,
          border: `1px solid ${primaryColor}20`,
          borderRadius: '16px',
          padding: '40px 20px',
          boxShadow: `0 4px 20px ${primaryColor}20`,
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        };
      case 'modern':
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          borderRadius: '16px',
          padding: '40px 20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: accentColor,
        };
      case 'bold':
        return {
          backgroundColor: primaryColor,
          borderRadius: '16px',
          padding: '40px 20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: getTextColor(primaryColor),
        };
      default:
        return {};
    }
  };

  // QRコンテナのスタイル
  const getQrContainerStyle = (): React.CSSProperties => {
    switch (templateId) {
      case 'simple':
        return {
          backgroundColor: bgColor,
          padding: '20px',
          borderRadius: '12px',
          boxShadow: `0 2px 10px ${primaryColor}10`,
        };
      case 'modern':
        return {
          backgroundColor: bgColor,
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        };
      case 'bold':
        return {
          backgroundColor: bgColor,
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          border: `4px solid ${secondaryColor}`,
        };
      default:
        return {};
    }
  };

  // ヘッダースタイル
  const getTitleStyle = (): React.CSSProperties => {
    switch (templateId) {
      case 'simple':
        return {
          color: primaryColor,
          fontSize: '1.75rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
        };
      case 'modern':
        return {
          color: accentColor,
          fontSize: '1.75rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        };
      case 'bold':
        return {
          color: tinycolor(primaryColor).isDark() ? '#FFFFFF' : '#000000',
          fontSize: '1.75rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        };
      default:
        return {};
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
      canvas.width = qrSize + 40;
      canvas.height = qrSize + 40;

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
          ctx.drawImage(img, 20, 20, qrSize, qrSize);

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
      downloadLink.download = 'share-qrcode.svg';
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

  // キャプチャ画像に合わせたCardComponentスタイル
  const captureCardStyle = {
    width: '100%',
    maxWidth: '300px',
    margin: '0 auto',
  };

  return (
    <div className="flex flex-col items-center">
      <div style={captureCardStyle}>
        <div style={getTemplateStyle()} className="w-full rounded-xl overflow-hidden aspect-[3/4]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={getTitleStyle()}
          >
            {userName || 'シンプルにつながる'}
          </motion.div>

          {/* QR コード */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={getQrContainerStyle()}
            ref={qrRef}
          >
            <QRCodeSVG
              value={profileUrl || 'https://example.com'}
              size={qrSize}
              fgColor={qrColor}
              bgColor={bgColor}
              level="M"
              includeMargin={false}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-sm"
          >
            {profileUrl ? profileUrl.replace(/^https?:\/\//, '') : 'example.com/profile'}
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-6 w-full">
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