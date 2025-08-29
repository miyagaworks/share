// components/admin/AdminShippingManagementPanel.tsx
'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { ONE_TAP_SEAL_STATUS_NAMES, type OneTapSealStatus } from '@/types/one-tap-seal';

// 注文アイテムの型定義
interface OrderItem {
  id: string;
  color: 'black' | 'gray' | 'white';
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

// 注文詳細の型定義
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

  items: OrderItem[];

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
      color: 'black' | 'gray' | 'white';
      quantity: number;
      urls: string[];
    }>;
    bulkUrlList: string[];
  };
}

interface AdminShippingManagementPanelProps {
  order: EnhancedOrderDetail;
  onOrderUpdate?: () => void;
}

export function AdminShippingManagementPanel({
  order,
  onOrderUpdate,
}: AdminShippingManagementPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');

  // ステータス更新処理
  const updateOrderStatus = useCallback(
    async (newStatus: OneTapSealStatus) => {
      setIsUpdating(true);
      try {
        const response = await fetch(`/api/admin/one-tap-seal/orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          toast.success(`ステータスを「${ONE_TAP_SEAL_STATUS_NAMES[newStatus]}」に更新しました`);
          onOrderUpdate?.();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'ステータス更新に失敗しました');
        }
      } catch (error) {
        console.error('ステータス更新エラー:', error);
        toast.error(error instanceof Error ? error.message : 'ステータス更新に失敗しました');
      } finally {
        setIsUpdating(false);
      }
    },
    [order.id, onOrderUpdate],
  );

  // 発送完了処理
  const completeShipping = useCallback(async () => {
    if (!trackingNumber.trim()) {
      toast.error('追跡番号を入力してください');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/one-tap-seal/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'shipped',
          trackingNumber: trackingNumber.trim(),
        }),
      });

      if (response.ok) {
        toast.success('発送完了処理が完了し、顧客にメールを送信しました');
        onOrderUpdate?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '発送処理に失敗しました');
      }
    } catch (error) {
      console.error('発送処理エラー:', error);
      toast.error(error instanceof Error ? error.message : '発送処理に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  }, [order.id, trackingNumber, onOrderUpdate]);

  // 追跡URLを生成
  const getTrackingUrl = useCallback((trackingNum: string) => {
    return `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${trackingNum}`;
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <Truck className="h-5 w-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold">発送管理</h3>
      </div>

      {/* 現在のステータス表示 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">現在のステータス:</span>
            <div className="font-semibold text-lg">{ONE_TAP_SEAL_STATUS_NAMES[order.status]}</div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'paid' || order.status === 'pending'
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

      {/* 支払い完了時の処理 */}
      {(order.status === 'paid' || order.status === 'pending') && (
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-800 mb-1">準備作業を開始してください</h4>
              <p className="text-sm text-orange-700">
                支払いが確認されました。NFCタグ書き込み作業を行い、準備中ステータスに更新してください。
              </p>
            </div>
          </div>

          <Button
            onClick={() => updateOrderStatus('preparing')}
            disabled={isUpdating}
            className="w-full"
            variant="default"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                更新中...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                準備中に変更
              </>
            )}
          </Button>
        </div>
      )}

      {/* 準備中時の処理 */}
      {order.status === 'preparing' && (
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Package className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                NFCタグ書き込み完了後、発送してください
              </h4>
              <p className="text-sm text-blue-700">
                上部の「URLマネージャー」でNFCタグ書き込み用URLを確認し、作業完了後に発送処理を行ってください。
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                クリックポスト追跡番号
              </label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="例: 1234-5678-9012"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                クリックポストの追跡番号を入力してください
              </p>
            </div>

            <Button
              onClick={completeShipping}
              disabled={!trackingNumber.trim() || isUpdating}
              className="w-full"
              size="lg"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  発送処理中...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  発送完了・顧客に通知メール送信
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 発送完了時の表示 */}
      {order.status === 'shipped' && (
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">発送完了済み</h4>
              <p className="text-sm text-green-700">
                商品は正常に発送され、顧客に通知メールが送信されました。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 block mb-1">追跡番号:</span>
              <div className="font-mono text-lg">{order.trackingNumber}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 block mb-1">発送日時:</span>
              <div>
                {order.shippedAt
                  ? new Date(order.shippedAt).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '未設定'}
              </div>
            </div>
          </div>

          {order.trackingNumber && (
            <Button
              onClick={() => window.open(getTrackingUrl(order.trackingNumber!), '_blank')}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              日本郵便で追跡確認
            </Button>
          )}
        </div>
      )}

      {/* その他のステータス時の表示 */}
      {!['paid', 'pending', 'preparing', 'shipped'].includes(order.status) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center text-gray-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>現在のステータスでは発送管理は利用できません</span>
          </div>
        </div>
      )}

      {/* 発送作業のヒント */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">💡 発送作業のポイント</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• NFCタグ書き込み前に「動作確認」でURLの動作を確認してください</li>
          <li>• 色別に整理されたNFCタグに間違えないよう注意してください</li>
          <li>• 発送完了処理により顧客に自動的に通知メールが送信されます</li>
          <li>• 追跡番号は正確に入力してください（顧客が追跡に使用します）</li>
        </ul>
      </div>
    </Card>
  );
}