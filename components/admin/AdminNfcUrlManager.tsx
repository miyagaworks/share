// components/admin/AdminNfcUrlManager.tsx
'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Copy, ExternalLink, QrCode, Eye, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ONE_TAP_SEAL_COLOR_NAMES, type OneTapSealColor } from '@/types/one-tap-seal';

// NFCタグ情報の型定義
interface NfcTagInfo {
  totalTags: number;
  colorBreakdown: Array<{
    color: OneTapSealColor;
    quantity: number;
    urls: string[];
  }>;
  bulkUrlList: string[];
}

// 注文アイテムの型定義
interface OrderItem {
  id: string;
  color: OneTapSealColor;
  quantity: number;
  unitPrice: number;
  profileSlug: string;
  fullUrl: string;
  qrPreviewUrl: string;
  profile?: {
    slug: string;
    userId: string;
    userName?: string;
    userEmail?: string;
  };
  memberUser?: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface AdminNfcUrlManagerProps {
  items: OrderItem[];
  nfcTagInfo: NfcTagInfo;
}

export function AdminNfcUrlManager({ items, nfcTagInfo }: AdminNfcUrlManagerProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [urlTestResults, setUrlTestResults] = useState<Record<string, 'success' | 'error' | null>>(
    {},
  );

  // URLのコピー機能
  const copyUrl = useCallback(async (url: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URLをコピーしました');
    } catch (error) {
      toast.error('URLのコピーに失敗しました');
      console.error('Copy failed:', error);
    }
  }, []);

  // 全URLの一括コピー機能
  const copyAllUrls = useCallback(async () => {
    try {
      const allUrls = nfcTagInfo.bulkUrlList.join('\n');
      await navigator.clipboard.writeText(allUrls);
      toast.success(`${nfcTagInfo.totalTags}件のURLをまとめてコピーしました`);
    } catch (error) {
      toast.error('URLの一括コピーに失敗しました');
      console.error('Bulk copy failed:', error);
    }
  }, [nfcTagInfo]);

  // URL動作テスト機能
  const testUrl = useCallback(async (url: string, itemId: string) => {
    setLoadingStates((prev) => ({ ...prev, [itemId]: true }));

    try {
      const response = await fetch(url, { method: 'HEAD' });
      const result = response.ok ? 'success' : 'error';
      setUrlTestResults((prev) => ({ ...prev, [itemId]: result }));

      if (result === 'success') {
        toast.success('URL動作確認OK');
      } else {
        toast.error('URL動作確認NG - ページが見つかりません');
      }
    } catch (error) {
      setUrlTestResults((prev) => ({ ...prev, [itemId]: 'error' }));
      toast.error('URL動作確認に失敗しました');
      console.error('URL test failed:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [itemId]: false }));
    }
  }, []);

  // プレビューページを開く
  const openPreview = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // QRコードプレビューを開く
  const openQrPreview = useCallback((qrPreviewUrl: string) => {
    window.open(qrPreviewUrl, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="space-y-4">
      {/* 概要情報 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900 mb-1">NFCタグ書き込み用URL管理</h4>
            <p className="text-sm text-blue-700">
              合計 <span className="font-semibold">{nfcTagInfo.totalTags}</span> 枚のNFCタグ用URL
            </p>
          </div>
          <Button
            onClick={copyAllUrls}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Copy className="h-3 w-3 mr-1" />
            全URLコピー
          </Button>
        </div>
      </Card>

      {/* 色別URL管理 */}
      <div className="space-y-3">
        {nfcTagInfo.colorBreakdown.map((colorGroup, groupIndex) => (
          <Card key={`${colorGroup.color}-${groupIndex}`} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 ${
                    colorGroup.color === 'black'
                      ? 'bg-black border-gray-300'
                      : colorGroup.color === 'white'
                        ? 'bg-white border-gray-300'
                        : colorGroup.color === 'gray'
                          ? 'bg-gray-400 border-gray-300'
                          : 'bg-gray-200 border-gray-300'
                  }`}
                />
                <span className="font-medium">
                  {ONE_TAP_SEAL_COLOR_NAMES[colorGroup.color]} × {colorGroup.quantity}枚
                </span>
              </div>
            </div>

            {/* 該当する注文アイテムの詳細 */}
            <div className="space-y-2">
              {items
                .filter((item) => item.color === colorGroup.color)
                .map((item, itemIndex) => (
                  <div key={`${item.id}-${itemIndex}`} className="border rounded-lg p-3 bg-gray-50">
                    {/* プロフィール情報 */}
                    <div className="mb-2 text-sm text-gray-600">
                      {item.profile?.userName || item.memberUser?.name || 'ユーザー名未設定'}(
                      {item.profile?.userEmail || item.memberUser?.email || 'メール未設定'})
                    </div>

                    {/* URL表示 */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">NFCタグ書き込み用URL:</div>
                      <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                        {item.fullUrl}
                      </div>
                    </div>

                    {/* 操作ボタン */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => copyUrl(item.fullUrl, item.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        コピー
                      </Button>

                      <Button
                        onClick={() => testUrl(item.fullUrl, item.id)}
                        size="sm"
                        variant="outline"
                        disabled={loadingStates[item.id]}
                        className={`${
                          urlTestResults[item.id] === 'success'
                            ? 'border-green-300 bg-green-50 text-green-700'
                            : urlTestResults[item.id] === 'error'
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : ''
                        }`}
                      >
                        {loadingStates[item.id] ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : urlTestResults[item.id] === 'success' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : urlTestResults[item.id] === 'error' ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        動作確認
                      </Button>

                      <Button onClick={() => openPreview(item.fullUrl)} size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        プレビュー
                      </Button>

                      {item.qrPreviewUrl && (
                        <Button
                          onClick={() => openQrPreview(item.qrPreviewUrl)}
                          size="sm"
                          variant="outline"
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          QRコード
                        </Button>
                      )}
                    </div>

                    {/* URL動作テスト結果表示 */}
                    {urlTestResults[item.id] && (
                      <div className="mt-2 text-xs">
                        {urlTestResults[item.id] === 'success' ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            URL動作確認済み
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            URL動作に問題があります
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>

      {/* NFCタグ書き込み作業のヒント */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">💡 NFCタグ書き込み作業のポイント</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 各URLをコピーしてNFCタグ書き込みアプリで使用してください</li>
          <li>• 「動作確認」ボタンでURLが正しく動作することを確認できます</li>
          <li>• 色別に整理されているので、対応するNFCタグに間違えないよう注意してください</li>
          <li>• 書き込み前にプレビューで内容を確認することをお勧めします</li>
        </ul>
      </Card>
    </div>
  );
}