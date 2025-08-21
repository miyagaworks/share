// components/subscription/TouchSealSection.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import {
  Package,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import { TouchSealOrderForm } from '../touch-seal/TouchSealOrderForm';

interface UserInfo {
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

interface TouchSealOrder {
  id: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  itemCount: number;
  trackingNumber?: string;
}

export function TouchSealSection() {
  const { data: session } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [touchSealOrders, setTouchSealOrders] = useState<TouchSealOrder[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  // ユーザー情報の取得（複数のAPIを試行）
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // 基本のユーザー情報を設定
        let basicUserInfo: UserInfo = {
          id: session.user.id,
          name: session.user.name || undefined,
          email: session.user.email || '',
        };

        // 複数のAPIエンドポイントを試行して情報を収集
        try {
          // 既存のdashboard-info APIを試行（正しいパス）
          const dashboardResponse = await fetch('/api/user/dashboard-info');
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            if (dashboardData.user) {
              basicUserInfo = { ...basicUserInfo, ...dashboardData.user };
            }
          }
        } catch (error) {
          console.log('dashboard-info API not available');
        }

        // profile APIも試行
        try {
          const profileResponse = await fetch('/api/profile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.user) {
              basicUserInfo = { ...basicUserInfo, ...profileData.user };
            }
          }
        } catch (error) {
          console.log('profile API not available');
        }

        // QRコード情報を別途取得
        try {
          const qrResponse = await fetch('/api/qrcode');
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.qrCodes) {
              basicUserInfo.qrCodes = qrData.qrCodes.map((qr: any) => ({
                id: qr.id,
                slug: qr.slug,
                views: qr.views || 0,
              }));
            }
          }
        } catch (error) {
          console.log('QR codes could not be loaded');
        }

        setUserInfo(basicUserInfo);

        // タッチシール注文履歴を取得
        try {
          const ordersResponse = await fetch('/api/touch-seal/orders');
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setTouchSealOrders(ordersData.orders || []);
          }
        } catch (error) {
          console.log('Touch seal orders could not be loaded');
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [session]);

  // 注文完了ハンドラ
  const handleOrderComplete = (orderId: string) => {
    setShowOrderForm(false);
    toast.success('注文が完了しました！決済画面に進みます。');

    // 注文履歴を更新
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/touch-seal/orders');
        if (response.ok) {
          const data = await response.json();
          setTouchSealOrders(data.orders || []);
        }
      } catch (error) {
        console.error('注文履歴更新エラー:', error);
      }
    };
    fetchOrders();
  };

  // 権限チェック
  const hasActivePlan =
    userInfo?.subscriptionStatus === 'active' ||
    userInfo?.subscriptionStatus === 'trialing' ||
    userInfo?.subscriptionStatus === 'permanent';

  const isCorporateMember = userInfo?.tenantId && userInfo?.corporateRole !== 'admin';
  const canOrderTouchSeal = hasActivePlan && !isCorporateMember;

  // ユーザーのQRスラッグを取得
  const userQrSlug = userInfo?.qrCodes?.[0]?.slug;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>読み込み中...</span>
        </div>
      </Card>
    );
  }

  // 注文フォーム表示中
  if (showOrderForm) {
    return (
      <div className="w-full">
        <TouchSealOrderForm
          onOrderComplete={handleOrderComplete}
          onCancel={() => setShowOrderForm(false)}
          userQrSlug={userQrSlug}
          userName={userInfo?.name}
        />
      </div>
    );
  }

  // 権限がない場合の表示
  if (!canOrderTouchSeal) {
    return (
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
          <h3 className="text-lg font-semibold">タッチシール注文</h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            {!hasActivePlan
              ? 'タッチシールを注文するには有効なプランが必要です。'
              : 'タッチシールの注文は法人の管理者が行います。管理者にお問い合わせください。'}
          </p>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex space-x-2">
              <div className="w-6 h-6 bg-black rounded-full border"></div>
              <div className="w-6 h-6 bg-gray-400 rounded-full border"></div>
              <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300"></div>
            </div>
            <div>
              <p className="font-medium">タッチシール（NFCタグシール）</p>
              <p className="text-sm text-gray-600">
                価格: 550円（税込）/枚 + 配送料: 185円（税込）
              </p>
            </div>
          </div>

          <Button onClick={() => setShowImageModal(true)} variant="outline" className="w-full">
            <Package className="h-4 w-4 mr-2" />
            実物の写真を見る
          </Button>
        </div>
      </Card>
    );
  }

  // 通常の表示
  return (
    <div className="space-y-6">
      {/* タッチシール商品情報 */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">タッチシール注文</h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">NFCタッチでプロフィールを共有できるスマートシールです</p>

          {/* 商品画像とカラー */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-black rounded-full border border-gray-300"></div>
              <div className="w-8 h-8 bg-gray-400 rounded-full border border-gray-300"></div>
              <div className="w-8 h-8 bg-white rounded-full border-2 border-gray-300"></div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">ブラック、グレー、ホワイト</span>
              <span className="text-sm text-gray-600">価格: 550円（税込）/枚</span>
              <span className="text-sm text-gray-600">配送料: 185円（税込）</span>
              <span className="text-xs text-gray-500">クリックポスト配送（追跡番号付き）</span>
            </div>
          </div>

          {/* 特徴 */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="mr-2">📱</span>
              <span>スマホでタッチするだけ</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🔗</span>
              <span>プロフィールページへ直接誘導</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">✨</span>
              <span>名刺交換の新しい形</span>
            </div>
          </div>

          <Button onClick={() => setShowImageModal(true)} variant="outline" className="w-full">
            <Package className="h-4 w-4 mr-2" />
            実物の写真を見る
          </Button>

          {/* 現在のURL設定とボタンをレイアウト改善 */}
          {userQrSlug && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">URL設定済み:</p>
                    <p className="text-sm text-green-700 break-all">
                      app.share-sns.com/qr/{userQrSlug}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setShowOrderForm(true)}
                  className="w-full min-h-[48px] px-4 py-3"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">タッチシールを注文</span>
                </Button>
              </div>
            </div>
          )}

          {!userQrSlug && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  QRコードを作成してからタッチシールを注文してください
                </p>
              </div>

              <Button
                onClick={() => setShowOrderForm(true)}
                className="w-full min-h-[48px] px-4 py-3"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">タッチシールを注文</span>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 注文履歴 */}
      {touchSealOrders.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-semibold">注文履歴</h3>
          </div>

          <div className="space-y-3">
            {touchSealOrders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">注文 #{order.id.slice(0, 8)}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
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

            {touchSealOrders.length > 3 && (
              <div className="text-center">
                <Button variant="outline" size="sm">
                  すべての注文を表示 ({touchSealOrders.length}件)
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 画像モーダル - 背景50%透明、正しいアスペクト比 */}
      {showImageModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">タッチシール実物写真</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowImageModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              {/* 横600px縦270pxの比率を保持 */}
              <div
                className="w-full rounded-lg overflow-hidden mb-4"
                style={{
                  aspectRatio: '600/270', // 横600px縦270pxの比率
                  maxHeight: '270px',
                }}
              >
                <Image
                  src="/images/nfc/3colors.png"
                  alt="タッチシール実物写真 - ブラック、グレー、ホワイトの3色"
                  width={600}
                  height={270}
                  className="w-full h-full object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                  priority
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                NFCタグが内蔵されたスマートシールです。スマートフォンでタッチするだけでプロフィールページにアクセスできます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}