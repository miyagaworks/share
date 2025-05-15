// components/qrcode/QrCodeGenerator.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaImage, FaCode, FaArrowLeft, FaMobile } from 'react-icons/fa';
import { Input } from '@/components/ui/Input';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

// QRコードの色オプション
const QR_COLOR_OPTIONS = [
  { id: 'black', name: 'ブラック', value: '#000000' },
  { id: 'darkGray', name: 'ダークグレー', value: '#333333' },
  { id: 'blue', name: 'ブルー', value: '#1e40af' },
  { id: 'red', name: 'レッド', value: '#b91c1c' },
  { id: 'green', name: 'グリーン', value: '#15803d' },
];

// デザインテンプレート
const DESIGN_TEMPLATES = [
  {
    id: 'minimal',
    name: 'ミニマル',
    description: 'シンプルでクリーンなデザイン',
    previewClass: 'bg-gradient-to-br from-white to-gray-100 border border-gray-200 shadow-sm',
  },
  {
    id: 'gradient',
    name: 'グラデーション',
    description: 'モダンなグラデーション背景',
    previewClass: 'bg-gradient-to-br from-primary-light to-primary-dark shadow-md',
  },
  {
    id: 'pattern',
    name: 'パターン',
    description: '洗練されたパターン背景',
    previewClass: 'bg-pattern shadow-lg',
  },
];

export function QrCodeGenerator() {
  const { data: session } = useSession();
  const isBrowser = typeof window !== 'undefined';
  const [url, setUrl] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState(QR_COLOR_OPTIONS[0].id);
  const [selectedTemplate, setSelectedTemplate] = useState(DESIGN_TEMPLATES[0].id);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6'); // デフォルトカラー
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF'); // デフォルト二次カラー
  const [accentColor, setAccentColor] = useState('#FFFFFF'); // アクセントカラー
  const [showQrCode, setShowQrCode] = useState(false);
  const [title, setTitle] = useState('My Profile'); // タイトル（オプション）
  const [showSaveInstructions, setShowSaveInstructions] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const [corporateLogoUrl, setCorporateLogoUrl] = useState<string | null>(null);

  // ユーザーが法人契約かどうかの判定
  const isCorporateMember = !!session?.user?.tenantId;

  // ユーザーのプロフィールURLを読み込む
  useEffect(() => {
    const loadProfileUrl = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data?.user?.profile?.slug) {
            const baseUrl = `${window.location.origin}/${data.user.profile.slug}`;
            setUrl(baseUrl);
            setProfileUrl(baseUrl);

            // ユーザー名をタイトルに設定
            if (data?.user?.name) {
              setTitle(data.user.name);
            }

            // ユーザーの設定色を取得
            if (data?.user?.mainColor) {
              setPrimaryColor(data.user.mainColor);
            }
          }
        }
      } catch (error) {
        console.error('プロフィールURLの取得に失敗しました', error);
      }
    };

    loadProfileUrl();
  }, []);

  // 法人ロゴを取得する処理
  useEffect(() => {
    // ブラウザ環境かどうかをチェック（重複を削除）
    if (!isBrowser) return;

    const fetchCorporateLogo = async () => {
      if (isCorporateMember) {
        try {
          const response = await fetch('/api/corporate/branding');
          if (response.ok) {
            const data = await response.json();
            if (data.branding?.logoUrl) {
              setCorporateLogoUrl(data.branding.logoUrl);
            }
          }
        } catch (error) {
          console.error('法人ロゴ取得エラー:', error);
        }
      }
    };

    fetchCorporateLogo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCorporateMember]);

  // 選択された色のオブジェクトを取得
  const colorOption =
    QR_COLOR_OPTIONS.find((option) => option.id === selectedColor) || QR_COLOR_OPTIONS[0];
  const qrColor = colorOption.value;
  const bgColor = 'white';

  // QRコード生成
  const generateQrCode = () => {
    if (!url.trim()) {
      toast.error('URLを入力してください');
      return;
    }

    // URLの形式を確認
    let processedUrl = url.trim();
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = `https://${processedUrl}`;
    }

    setProfileUrl(processedUrl);
    setShowQrCode(true);
  };

  // テンプレートに基づいたスタイルを取得
  const getTemplateStyle = (): Record<string, React.CSSProperties> => {
    switch (selectedTemplate) {
      case 'minimal':
        return {
          container: {
            backgroundColor: bgColor,
            border: `1px solid ${primaryColor}20`,
            borderRadius: '16px',
            padding: '40px',
            boxShadow: `0 4px 20px ${primaryColor}20`,
            position: 'relative',
            overflow: 'hidden',
          },
          inner: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          },
          title: {
            color: primaryColor,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
          },
          subtitle: {
            color: secondaryColor,
            fontSize: '0.875rem',
            marginTop: '1rem',
          },
          qrContainer: {
            backgroundColor: bgColor,
            padding: '20px',
            borderRadius: '12px',
            boxShadow: `0 2px 10px ${primaryColor}10`,
          },
        };
      case 'gradient':
        return {
          container: {
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            overflow: 'hidden',
          },
          inner: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          },
          title: {
            color: accentColor,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
          subtitle: {
            color: accentColor,
            fontSize: '0.875rem',
            marginTop: '1rem',
            opacity: 0.9,
          },
          qrContainer: {
            backgroundColor: bgColor,
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          },
        };
      case 'pattern':
        return {
          container: {
            backgroundColor: primaryColor,
            backgroundImage: `radial-gradient(${secondaryColor}20 1.5px, transparent 1.5px)`,
            backgroundSize: '20px 20px',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            overflow: 'hidden',
          },
          inner: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          },
          title: {
            color: accentColor,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          },
          subtitle: {
            color: accentColor,
            fontSize: '0.875rem',
            marginTop: '1rem',
            opacity: 0.9,
          },
          qrContainer: {
            backgroundColor: bgColor,
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            border: '4px solid white',
          },
        };
      default:
        return {
          container: {},
          inner: {},
          title: {},
          subtitle: {},
          qrContainer: {},
        };
    }
  };

  const templateStyle = getTemplateStyle();

  // ダウンロード用のキャンバス生成
  const generateCanvas = () => {
    if (!qrRef.current) return null;

    const div = qrRef.current;
    const width = div.offsetWidth;
    const height = div.offsetHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // コンテナの背景を描画
    ctx.fillStyle = getComputedStyle(div).backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // HTMLからSVGとテキスト要素を取得してキャンバスに描画
    const svg = div.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new window.Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

      return { canvas, img, ctx, width, height };
    }

    return null;
  };

  // PNGとしてダウンロード
  const downloadQrAsPng = () => {
    // ブラウザ環境かどうかをチェックを関数の先頭で行う
    if (!isBrowser || !qrRef.current) return;

    // サーバー環境では早期リターン
    if (!isBrowser || !qrRef.current) {
      console.log('サーバーサイドまたは参照がないため処理をスキップします');
      return;
    }

    const canvasData = generateCanvas();
    if (!canvasData) {
      toast.error('QRコードが見つかりません');
      return;
    }

    const { canvas, img, ctx, width, height } = canvasData;

    try {
      img.onload = () => {
        // 背景を再描画（テンプレートに応じた背景）
        const containerStyle = getTemplateStyle().container;
        if (containerStyle.backgroundColor) {
          ctx.fillStyle = containerStyle.backgroundColor as string;
          ctx.fillRect(0, 0, width, height);
        }

        // グラデーションの場合は処理
        if (selectedTemplate === 'gradient') {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, primaryColor);
          gradient.addColorStop(1, secondaryColor);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }

        // パターンの場合は処理
        if (selectedTemplate === 'pattern') {
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, width, height);

          // パターンの描画
          ctx.fillStyle = secondaryColor + '20';
          const dotSize = 1.5;
          const spacing = 20;
          for (let x = 0; x < width; x += spacing) {
            for (let y = 0; y < height; y += spacing) {
              ctx.beginPath();
              ctx.arc(x, y, dotSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // QRコードコンテナの描画
        const qrContainer = qrRef.current?.querySelector('.qr-container');
        if (qrContainer) {
          const rect = qrContainer.getBoundingClientRect();
          const divRect = qrRef.current?.getBoundingClientRect();
          if (divRect) {
            const x = rect.left - divRect.left;
            const y = rect.top - divRect.top;

            ctx.fillStyle = 'white';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;
            ctx.beginPath();
            ctx.roundRect(x, y, rect.width, rect.height, 12);
            ctx.fill();
            ctx.shadowColor = 'transparent';
          }
        }

        // テキスト要素の描画
        const titleEl = qrRef.current?.querySelector('.title-text');
        if (titleEl) {
          const rect = titleEl.getBoundingClientRect();
          const divRect = qrRef.current?.getBoundingClientRect();
          if (divRect) {
            const x = rect.left - divRect.left + rect.width / 2;
            const y = rect.top - divRect.top + rect.height / 2;

            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = selectedTemplate === 'minimal' ? primaryColor : 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(title, x, y);
          }
        }

        // SVGの描画
        if (qrContainer) {
          const rect = qrContainer.getBoundingClientRect();
          const divRect = qrRef.current?.getBoundingClientRect();
          if (divRect) {
            const x = rect.left - divRect.left;
            const y = rect.top - divRect.top;

            // SVG（QRコード）を中央に描画
            const svgEl = qrContainer.querySelector('svg');
            if (svgEl) {
              const svgRect = svgEl.getBoundingClientRect();
              ctx.drawImage(
                img,
                x + (rect.width - svgRect.width) / 2,
                y + (rect.height - svgRect.height) / 2,
              );
            }
          }
        }

        // URLテキストの描画
        const subtitleEl = qrRef.current?.querySelector('.subtitle-text');
        if (subtitleEl) {
          const rect = subtitleEl.getBoundingClientRect();
          const divRect = qrRef.current?.getBoundingClientRect();
          if (divRect) {
            const x = rect.left - divRect.left + rect.width / 2;
            const y = rect.top - divRect.top + rect.height / 2;

            ctx.font = '14px sans-serif';
            ctx.fillStyle = selectedTemplate === 'minimal' ? secondaryColor : 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(profileUrl.replace(/^https?:\/\//, ''), x, y);
          }
        }

        // ダウンロード
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'stylish-qrcode.png';
        downloadLink.click();

        toast.success('スタイリッシュQRコードをダウンロードしました');
      };
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
      const svg = qrRef.current.querySelector('.qr-container svg');
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/share"
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          共有設定に戻る
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">スタイリッシュなQRコードデザイナー</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QRコードに変換するURL
          </label>
          <div className="flex space-x-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button onClick={generateQrCode} className="bg-blue-700 hover:bg-blue-800 text-white">
              QRコード生成
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            デフォルトではあなたのプロフィールURLが設定されています
          </p>
        </div>

        {showQrCode && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-medium mb-4">デザイン設定</h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テンプレートスタイル
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {DESIGN_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-3 border rounded-lg text-center transition ${
                          selectedTemplate === template.id
                            ? 'border-blue-500 ring-2 ring-blue-500/30'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`h-20 mb-2 rounded-md ${template.previewClass}`}></div>
                        <span className="block font-medium">{template.name}</span>
                        <span className="block text-xs text-gray-500">{template.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QRコードの色
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {QR_COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedColor(option.id)}
                        className={`h-12 rounded-md transition-colors flex items-center justify-center ${
                          selectedColor === option.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        }`}
                        style={{
                          backgroundColor: option.value,
                        }}
                      >
                        <span className="sr-only">{option.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトルテキスト
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Profile"
                    className="w-full"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メインカラー
                  </label>
                  <EnhancedColorPicker color={primaryColor} onChange={setPrimaryColor} />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    セカンダリカラー
                  </label>
                  <EnhancedColorPicker color={secondaryColor} onChange={setSecondaryColor} />
                </div>

                {(selectedTemplate === 'gradient' || selectedTemplate === 'pattern') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      アクセントカラー
                    </label>
                    <EnhancedColorPicker color={accentColor} onChange={setAccentColor} />
                  </div>
                )}

                {/* 法人契約ユーザーのみロゴのアップロードを表示 */}
                {isCorporateMember && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ロゴアップロード（法人契約特典）
                    </label>
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <p className="text-sm text-gray-500">ロゴアップロード機能は準備中です</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full flex items-center gap-2 justify-center bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={downloadQrAsPng}
                  >
                    <FaImage className="h-4 w-4" />
                    スタイリッシュQRコードをダウンロード
                  </Button>

                  <Button
                    className="w-full flex items-center gap-2 justify-center bg-gray-700 hover:bg-gray-800 text-white"
                    onClick={downloadQrAsSvg}
                  >
                    <FaCode className="h-4 w-4" />
                    QRコードのみ（SVG）をダウンロード
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-2 justify-center"
                    onClick={() => setShowSaveInstructions(true)}
                  >
                    <FaMobile className="h-4 w-4" />
                    スマホに保存する方法
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium mb-4">プレビュー</h2>
                <div
                  ref={qrRef}
                  style={templateStyle.container}
                  className="mx-auto w-full max-w-xs aspect-square"
                >
                  <div style={templateStyle.inner}>
                    <div style={templateStyle.title} className="title-text">
                      {title}
                    </div>
                    <div style={templateStyle.qrContainer} className="qr-container">
                      {/* ここにロゴを追加 */}
                      {isCorporateMember && corporateLogoUrl && (
                        <div className="mb-3 flex justify-center">
                          <Image
                            src={corporateLogoUrl}
                            alt="企業ロゴ"
                            width={100}
                            height={40}
                            className="h-10 w-auto object-contain mb-2"
                          />
                        </div>
                      )}
                      <QRCodeSVG
                        value={profileUrl}
                        size={150}
                        fgColor={qrColor}
                        bgColor={bgColor}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div style={templateStyle.subtitle} className="subtitle-text">
                      {profileUrl.replace(/^https?:\/\//, '')}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center mt-4">
                  このQRコードをダウンロードして、印刷やSNSでの共有に使用できます。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* スマホ保存説明モーダル */}
      {showSaveInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">スマホのホーム画面に追加する方法</h3>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium text-lg mb-2">iPhoneの場合:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Safariでこのページを開きます</li>
                  <li>共有ボタン（□に↑のアイコン）をタップ</li>
                  <li>「ホーム画面に追加」を選択</li>
                  <li>追加をタップ</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-lg mb-2">Androidの場合:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Chromeでこのページを開きます</li>
                  <li>メニューボタン（⋮）をタップ</li>
                  <li>「ホーム画面に追加」を選択</li>
                  <li>追加をタップ</li>
                </ol>
              </div>

              <p className="text-sm text-gray-600 italic">
                ホーム画面に追加すると、ワンタップでこのQRコードページを表示できます。
                スマホを取り出してアイコンをタップするだけで、すぐに相手にQRコードを読み取ってもらえます。
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowSaveInstructions(false)}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}