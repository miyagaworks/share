// components/one-tap-seal/OneTapSealSection.tsx
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
import { OneTapSealColorSelector } from './OneTapSealColorSelector';
import { OneTapSealOrderForm } from './OneTapSealOrderForm';
import { calculateOrderAmount } from '@/lib/one-tap-seal/order-calculator';
import {
  ONE_TAP_SEAL_CONFIG,
  type OneTapSealSelection,
  type OneTapSealOrder,
} from '@/types/one-tap-seal';

interface UserInfo {
  id: string;
  name?: string;
  email: string;
  subscriptionStatus?: string;
  corporateRole?: string;
  tenantId?: string;
  profile?: {
    id: string;
    slug: string;
    views: number;
  };
  qrCodes?: Array<{
    id: string;
    slug: string;
    views: number;
  }>;
}

export function OneTapSealSection() {
  const { data: session } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [oneTapSealOrders, setOneTapSealOrders] = useState<OneTapSealOrder[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  // 注文フォーム用の状態
  const [selectedItems, setSelectedItems] = useState<OneTapSealSelection>({
    black: 0,
    gray: 0,
    white: 0,
  });

  // ユーザー情報の取得
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
          const dashboardResponse = await fetch('/api/user/dashboard-info');
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            if (dashboardData.user) {
              basicUserInfo = { ...basicUserInfo, ...dashboardData.user };
            }
          }
        } catch (error) {
        }

        try {
          const profileResponse = await fetch('/api/profile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.user) {
              basicUserInfo = { ...basicUserInfo, ...profileData.user };
              // profileフィールドを明示的に設定
              if (profileData.user.profile) {
                basicUserInfo.profile = profileData.user.profile;
              }
            }
          }
        } catch (error) {
        }

        // QRコード情報を取得
        try {
          const qrResponse = await fetch('/api/qrcode');
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.qrCodes) {
              basicUserInfo.qrCodes = qrData.qrCodes;
            }
          }
        } catch (error) {
        }

        setUserInfo(basicUserInfo);

        // ワンタップシール注文履歴を取得
        try {
          const ordersResponse = await fetch('/api/one-tap-seal/orders');
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setOneTapSealOrders(ordersData.orders || []);
          }
        } catch (error) {
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [session]);

  // 注文完了処理
  const handleOrderComplete = (orderId: string) => {
    setShowOrderForm(false);
    toast.success('ワンタップシールの注文が完了しました！');
    // 注文履歴を再取得
    fetchOneTapSealOrders();
  };

  // 注文履歴のみを再取得する関数
  const fetchOneTapSealOrders = async () => {
    try {
      const response = await fetch('/api/one-tap-seal/order');
      if (response.ok) {
        const data = await response.json();
        setOneTapSealOrders(data.orders || []);
      }
    } catch (error) {
      console.error('注文履歴取得エラー:', error);
    }
  };

  // ユーザーのQRスラッグを取得
  const userProfileSlug = userInfo?.profile?.slug;

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
      <OneTapSealOrderForm
        onOrderComplete={handleOrderComplete}
        onCancel={() => setShowOrderForm(false)}
        userProfileSlug={userProfileSlug}
        userName={userInfo?.name}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ワンタップシール商品情報 */}
      <Card className="p-6 border-2 border-dashed border-gray-300 bg-gray-50">
        <div className="flex items-center mb-6">
          <Package className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-800">🛒 オプション注文</h2>
          <span className="ml-3 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
            追加サービス
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 左側：画像と基本説明 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <Image
                src="/images/nfc/reading.png"
                alt="ワンタップシールの使い方 - スマホでタップするだけでプロフィール共有"
                width={270}
                height={400}
                className="rounded-lg shadow-md"
                style={{ width: 'auto', height: 'auto', maxWidth: '270px' }}
                priority
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">ワンタップシール</h3>
            <p className="text-sm text-gray-600">
              QRコードに変わる新しい共有方法
              <br />
              スマホをかざすだけで瞬時にプロフィールを共有
            </p>
          </div>

          {/* 右側：特徴と商品情報 */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">✨ ワンタップシールの特徴</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">📱</span>
                  <span>QRコードを開く必要なし - かざすだけ</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">⚡</span>
                  <span>瞬時にプロフィールページを表示</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🎯</span>
                  <span>名刺交換の新しいスタンダード</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🔗</span>
                  <span>従来のQRコードより簡単・確実</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">💎 商品ラインナップ</h4>
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-8 h-8 bg-black rounded-full border border-gray-300"></div>
                <div className="w-8 h-8 bg-gray-400 rounded-full border border-gray-300"></div>
                <div className="w-8 h-8 bg-white rounded-full border-2 border-gray-300"></div>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <strong>ブラック・グレー・ホワイト</strong>
                </p>
                <p>
                  価格: <strong>550円（税込）/枚</strong>
                </p>
                <p>
                  配送料: <strong>185円（税込）</strong>
                </p>
                <p className="text-xs text-gray-500">クリックポスト配送（追跡番号付き）</p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={() => setShowImageModal(true)} variant="outline" className="w-full mb-4">
          <Package className="h-4 w-4 mr-2" />
          実物の写真を見る
        </Button>

        {/* 現在のURL設定とボタンをレイアウト改善 */}
        {userProfileSlug && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">URL設定済み:</p>
                  <p className="text-sm text-green-700 break-all">
                    app.share-sns.com/{userProfileSlug}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowOrderForm(true)}
                className="w-full min-h-[44px] px-2 py-2 text-xs sm:text-sm sm:px-3 sm:py-3"
                size="lg"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  ワンタップシールを注文
                </span>
              </Button>
            </div>
          </div>
        )}

        {!userProfileSlug && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2 mb-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                QRコードを作成してからワンタップシールを注文してください
              </p>
            </div>

            <Button
              onClick={() => setShowOrderForm(true)}
              className="w-full min-h-[44px] px-2 py-2 text-xs sm:text-sm sm:px-3 sm:py-3"
              size="lg"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                ワンタップシールを注文
              </span>
            </Button>
          </div>
        )}
      </Card>

      {/* 注文履歴 */}
      {oneTapSealOrders.filter(
        (order) =>
          order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered',
      ).length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">注文履歴</h4>
          <div className="space-y-3">
            {oneTapSealOrders
              .filter(
                (order) =>
                  order.status === 'paid' ||
                  order.status === 'shipped' ||
                  order.status === 'delivered',
              )
              .map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium">注文 #{order.id.slice(-8)}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.orderDate).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">¥{order.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{order.status}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* 画像モーダル - レスポンシブ対応と画像サイズ改善 */}
      {showImageModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">ワンタップシール実物写真</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowImageModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              {/* 画像を画面幅いっぱいに大きく表示 */}
              <div className="w-full rounded-lg overflow-hidden mb-4">
                <Image
                  src="/images/nfc/3colors.png"
                  alt="ワンタップシール実物写真 - ブラック、グレー、ホワイトの3色"
                  width={600}
                  height={270}
                  className="w-full h-auto object-contain"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                  }}
                  priority
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                NFCタグが内蔵されたスマートシールです。スマートフォンでタップするだけでプロフィールページにアクセスできます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}