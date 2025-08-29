// components/admin/OneTapSealOrderDetailModal.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import {
  X,
  Package,
  Link,
  MapPin,
  User,
  Building,
  Loader2,
  Copy,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import {
  ONE_TAP_SEAL_COLOR_NAMES,
  ONE_TAP_SEAL_STATUS_NAMES,
  type OneTapSealColor,
  type OneTapSealStatus,
} from '@/types/one-tap-seal';
import { AdminNfcUrlManager } from './AdminNfcUrlManager';
import { AdminShippingManagementPanel } from './AdminShippingManagementPanel';

// 拡張された注文詳細データ型
interface EnhancedOrderDetail {
  id: string;
  orderDate: string;
  status: OneTapSealStatus;
  orderType: 'individual' | 'corporate';

  customer: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    tenantName?: string;
  };

  items: Array<{
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
  }>;

  sealTotal: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;

  shippingAddress: {
    postalCode: string;
    address: string;
    building?: string;
    recipientName: string;
  };

  trackingNumber?: string;
  shippedAt?: string;
  shippedBy?: string;

  nfcTagInfo: {
    totalTags: number;
    colorBreakdown: Array<{
      color: OneTapSealColor;
      quantity: number;
      urls: string[];
    }>;
    bulkUrlList: string[];
  };
}

interface OneTapSealOrderDetailModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate?: () => void;
}

export function OneTapSealOrderDetailModal({
  orderId,
  isOpen,
  onClose,
  onOrderUpdate,
}: OneTapSealOrderDetailModalProps) {
  const [order, setOrder] = useState<EnhancedOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNfcUrls, setShowNfcUrls] = useState(false);

  // nfcTagInfoを生成する関数
  const generateNfcTagInfo = useCallback((items: any[]) => {
    const colorBreakdown: Array<{
      color: OneTapSealColor;
      quantity: number;
      urls: string[];
    }> = [];

    const bulkUrlList: string[] = [];
    let totalTags = 0;

    // 色別にグループ化
    const colorGroups: Record<OneTapSealColor, string[]> = {
      black: [],
      gray: [],
      white: [],
    };

    items.forEach((item) => {
      const color = item.color as OneTapSealColor;
      // 数量に応じてURLを複製
      for (let i = 0; i < item.quantity; i++) {
        colorGroups[color].push(item.fullUrl);
        bulkUrlList.push(item.fullUrl);
        totalTags++;
      }
    });

    // colorBreakdownを作成
    (Object.keys(colorGroups) as OneTapSealColor[]).forEach((color) => {
      const urls = colorGroups[color];
      if (urls.length > 0) {
        colorBreakdown.push({
          color,
          quantity: urls.length,
          urls,
        });
      }
    });

    return {
      totalTags,
      colorBreakdown,
      bulkUrlList,
    };
  }, []);

  // 注文詳細データ取得
  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/one-tap-seal/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        // nfcTagInfoを生成
        const nfcTagInfo = generateNfcTagInfo(data.order.items);
        setOrder({
          ...data.order,
          nfcTagInfo,
        });
      } else {
        throw new Error('注文詳細の取得に失敗しました');
      }
    } catch (error) {
      console.error('注文詳細取得エラー:', error);
      toast.error('注文詳細の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, generateNfcTagInfo]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail();
    }
  }, [isOpen, orderId, fetchOrderDetail]);

  // 注文更新後のコールバック
  const handleOrderUpdate = useCallback(() => {
    fetchOrderDetail();
    onOrderUpdate?.();
  }, [fetchOrderDetail, onOrderUpdate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            注文詳細 #{order?.id.slice(-8) || orderId.slice(-8)}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>読み込み中...</span>
          </div>
        ) : order ? (
          <div className="p-6 space-y-6">
            {/* 基本情報 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                基本情報
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block">注文ID</span>
                  <div className="font-mono">{order.id}</div>
                </div>
                <div>
                  <span className="text-gray-600 block">注文日時</span>
                  <div>{new Date(order.orderDate).toLocaleString('ja-JP')}</div>
                </div>
                <div>
                  <span className="text-gray-600 block">注文者</span>
                  <div>{order.customer.name || '未設定'}</div>
                </div>
                <div>
                  <span className="text-gray-600 block">注文タイプ</span>
                  <div className="flex items-center">
                    {order.orderType === 'individual' ? (
                      <>
                        <User className="h-4 w-4 mr-1" />
                        個人注文
                      </>
                    ) : (
                      <>
                        <Building className="h-4 w-4 mr-1" />
                        法人注文
                        {order.customer.tenantName && (
                          <span className="ml-2 text-gray-600">({order.customer.tenantName})</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 block">メールアドレス</span>
                  <div>{order.customer.email}</div>
                </div>
                <div>
                  <span className="text-gray-600 block">現在のステータス</span>
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'paid'
                        ? 'bg-orange-100 text-orange-800'
                        : order.status === 'preparing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'shipped'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ONE_TAP_SEAL_STATUS_NAMES[order.status]}
                  </div>
                </div>
              </div>
            </Card>

            {/* 商品・URL情報 */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  商品・URL情報
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowNfcUrls(!showNfcUrls)}>
                  {showNfcUrls ? 'URL管理を非表示' : 'URL管理を表示'}
                </Button>
              </div>

              {showNfcUrls ? (
                /* 簡易URL管理表示 */
                <div className="space-y-4">
                  {/* 概要情報 */}
                  <div className="p-4 bg-blue-50 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">NFCタグ書き込み用URL管理</h4>
                        <p className="text-sm text-blue-700">
                          合計{' '}
                          <span className="font-semibold">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                          </span>{' '}
                          枚のNFCタグ用URL
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const allUrls = order.items
                            .flatMap((item) => Array(item.quantity).fill(item.fullUrl))
                            .join('\n');
                          navigator.clipboard.writeText(allUrls);
                          toast.success('全URLをコピーしました');
                        }}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        全URLコピー
                      </Button>
                    </div>
                  </div>

                  {/* 色別URL表示 */}
                  {order.items.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 ${
                              item.color === 'black'
                                ? 'bg-black border-gray-300'
                                : item.color === 'gray'
                                  ? 'bg-gray-400 border-gray-300'
                                  : 'bg-white border-2 border-gray-300'
                            }`}
                          />
                          <span className="font-medium">
                            {ONE_TAP_SEAL_COLOR_NAMES[item.color]} × {item.quantity}枚
                          </span>
                        </div>
                      </div>

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
                          onClick={() => {
                            navigator.clipboard.writeText(item.fullUrl);
                            toast.success('URLをコピーしました');
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          コピー
                        </Button>

                        <Button
                          onClick={() => window.open(item.fullUrl, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          プレビュー
                        </Button>

                        {item.qrPreviewUrl && (
                          <Button
                            onClick={() => window.open(item.qrPreviewUrl, '_blank')}
                            size="sm"
                            variant="outline"
                          >
                            <QrCode className="h-3 w-3 mr-1" />
                            QRコード
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 ${
                            item.color === 'black'
                              ? 'bg-black border-gray-300'
                              : item.color === 'gray'
                                ? 'bg-gray-400 border-gray-300'
                                : 'bg-white border-2 border-gray-300'
                          }`}
                        />
                        <span className="font-medium">{ONE_TAP_SEAL_COLOR_NAMES[item.color]}</span>
                        <span className="text-sm text-gray-600">× {item.quantity}枚</span>
                      </div>
                      <span className="font-medium">
                        ¥{(item.quantity * item.unitPrice).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-700">
                      「URL管理を表示」をクリックすると、NFCタグ書き込み用の詳細管理画面が表示されます
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* 配送先情報 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                配送先情報
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">郵便番号:</span>
                  <div
                    className="cursor-pointer hover:bg-gray-100 p-1 rounded inline-block"
                    onClick={() => {
                      navigator.clipboard.writeText(order.shippingAddress.postalCode);
                      toast.success('郵便番号をコピーしました');
                    }}
                  >
                    〒{order.shippingAddress.postalCode}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">住所:</span>
                  <div
                    className="cursor-pointer hover:bg-gray-100 p-1 rounded inline-block"
                    onClick={() => {
                      navigator.clipboard.writeText(order.shippingAddress.address);
                      toast.success('住所をコピーしました');
                    }}
                  >
                    {order.shippingAddress.address}
                  </div>
                </div>
                {order.shippingAddress.building && (
                  <div>
                    <span className="text-gray-600">マンション名・部屋番号:</span>
                    <div
                      className="cursor-pointer hover:bg-gray-100 p-1 rounded inline-block"
                      onClick={() => {
                        navigator.clipboard.writeText(order.shippingAddress.building!);
                        toast.success('マンション名・部屋番号をコピーしました');
                      }}
                    >
                      {order.shippingAddress.building}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">お名前:</span>
                  <div
                    className="cursor-pointer hover:bg-gray-100 p-1 rounded inline-block"
                    onClick={() => {
                      navigator.clipboard.writeText(order.shippingAddress.recipientName);
                      toast.success('お名前をコピーしました');
                    }}
                  >
                    {order.shippingAddress.recipientName}
                  </div>
                </div>
              </div>
            </Card>

            {/* 発送管理パネル - 確実に表示 */}
            <AdminShippingManagementPanel order={order} onOrderUpdate={handleOrderUpdate} />
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            注文データを読み込めませんでした
            <div className="mt-2 text-xs">Order ID: {orderId}</div>
          </div>
        )}
      </div>
    </div>
  );
}