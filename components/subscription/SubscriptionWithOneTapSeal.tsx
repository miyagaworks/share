// components/subscription/SubscriptionWithOneTapSeal.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Package, CreditCard, CheckCircle, AlertCircle, Plus, ExternalLink } from 'lucide-react';
import { OneTapSealOrderForm } from '../one-tap-seal/OneTapSealOrderForm';

interface UserData {
  id: string;
  name?: string;
  email: string;
  subscriptionStatus?: string;
  corporateRole?: string;
  tenantId?: string;
  qrCodes?: Array<{
    id: string;
    slug: string;
    views: number;
  }>;
}

interface OneTapSealOrder {
  id: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  itemCount: number;
  trackingNumber?: string;
}

export function SubscriptionWithOneTapSeal() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [oneTapSealOrders, setOneTapSealOrders] = useState<OneTapSealOrder[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザーデータの取得
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // ユーザー情報を取得
        const userResponse = await fetch('/api/dashboard-info');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData(userData.user);
        }

        // ワンタップシール注文履歴を取得
        const ordersResponse = await fetch('/api/one-tap-seal/orders');
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOneTapSealOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  // 注文完了ハンドラ
  const handleOrderComplete = (orderId: string) => {
    setShowOrderForm(false);
    toast.success('注文が完了しました！決済画面に進みます。');

    // 注文履歴を更新
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/one-tap-seal/orders');
        if (response.ok) {
          const data = await response.json();
          setOneTapSealOrders(data.orders || []);
        }
      } catch (error) {
        console.error('注文履歴更新エラー:', error);
      }
    };
    fetchOrders();
  };

  // 権限チェック
  const hasActivePlan =
    userData?.subscriptionStatus === 'active' ||
    userData?.subscriptionStatus === 'trialing' ||
    userData?.subscriptionStatus === 'permanent';

  const isCorporateMember = userData?.tenantId && userData?.corporateRole !== 'admin';
  const canOrderOneTapSeal = hasActivePlan && !isCorporateMember;

  // ユーザーのQRスラッグを取得
  const userQrSlug = userData?.qrCodes?.[0]?.slug;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* スケルトンローディング */}
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        </Card>
      </div>
    );
  }

  // 注文フォーム表示
  if (showOrderForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">ワンタップシール注文</h2>
          <Button variant="outline" onClick={() => setShowOrderForm(false)}>
            戻る
          </Button>
        </div>

        <OneTapSealOrderForm
          userQrSlug={userQrSlug}
          userName={userData?.name}
          onOrderComplete={handleOrderComplete}
          onCancel={() => setShowOrderForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ワンタップシール注文セクション */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">ワンタップシール注文（オプション）</h3>
        </div>

        {/* 権限チェック表示 */}
        {!hasActivePlan ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">有料プランが必要です</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              ワンタップシールを注文するには、有料プランにご加入ください。
            </p>
          </div>
        ) : isCorporateMember ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">法人メンバーの方へ</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              ワンタップシールの注文は法人管理者が行います。管理者にお問い合わせください。
            </p>
          </div>
        ) : (
          <>
            {/* ワンタップシール説明 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">ワンタップシールとは？</h4>
              <p className="text-sm text-blue-800 mb-3">
                NFCタグ搭載のシールです。スマートフォンをかざすだけで、
                あなたのプロフィールページを表示できます。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="w-6 h-6 bg-black rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-medium">ブラック</p>
                  <p className="text-xs text-gray-600">¥550</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="w-6 h-6 bg-gray-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-medium">グレー</p>
                  <p className="text-xs text-gray-600">¥550</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-medium">ホワイト</p>
                  <p className="text-xs text-gray-600">¥550</p>
                </div>
              </div>
            </div>

            {/* 注文ボタン */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">配送料: ¥185（全国一律・クリックポスト）</p>
                <p className="text-xs text-gray-500">※価格は税込表示です</p>
              </div>
              <Button onClick={() => setShowOrderForm(true)} className="flex items-center">
                <Plus className="h-4 w-4 mr-1" />
                ワンタップシールを注文
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* 注文履歴セクション */}
      {canOrderOneTapSeal && oneTapSealOrders.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-semibold">ワンタップシール注文履歴</h3>
          </div>

          <div className="space-y-3">
            {oneTapSealOrders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">注文 #{order.id.slice(-8)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'preparing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status === 'delivered'
                        ? '配送完了'
                        : order.status === 'shipped'
                          ? '発送済み'
                          : order.status === 'preparing'
                            ? '準備中'
                            : '注文受付中'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.orderDate).toLocaleDateString('ja-JP')} · {order.itemCount}枚 ·
                    ¥{order.totalAmount.toLocaleString()}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-xs text-gray-500">追跡番号: {order.trackingNumber}</p>
                  )}
                </div>

                {order.trackingNumber && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${order.trackingNumber}`,
                        '_blank',
                      )
                    }
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    追跡
                  </Button>
                )}
              </div>
            ))}

            {oneTapSealOrders.length > 3 && (
              <div className="text-center">
                <Button variant="outline" size="sm">
                  すべての注文を表示 ({oneTapSealOrders.length}件)
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 現在のQRコード表示 */}
      {canOrderOneTapSeal && userQrSlug && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            <h3 className="text-lg font-semibold">現在のQRコード</h3>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium">app.sns-share.com/qr/{userQrSlug}</p>
              <p className="text-sm text-gray-600">
                閲覧数: {userData?.qrCodes?.[0]?.views || 0} 回
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`https://app.sns-share.com/qr/${userQrSlug}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              プレビュー
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}