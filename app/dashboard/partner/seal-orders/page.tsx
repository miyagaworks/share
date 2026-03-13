// app/dashboard/partner/seal-orders/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { Package, Search, MapPin, User, Building, Loader2 } from 'lucide-react';
import {
  ONE_TAP_SEAL_STATUS_NAMES,
  type OneTapSealStatus,
  type OneTapSealOrder,
} from '@/types/one-tap-seal';

export default function PartnerSealOrdersPage() {
  const [orders, setOrders] = useState<OneTapSealOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OneTapSealOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OneTapSealStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OneTapSealOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/partner/seal-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        throw new Error('注文データの取得に失敗しました');
      }
    } catch (error) {
      console.error('注文データ取得エラー:', error);
      toast.error('注文データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // フィルタリング
  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.user?.name?.toLowerCase().includes(query) ||
          order.user?.email?.toLowerCase().includes(query) ||
          order.tenant?.name?.toLowerCase().includes(query) ||
          order.shippingAddress.recipientName.toLowerCase().includes(query),
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  const getStatusBadgeClass = (status: OneTapSealStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'paid':
        return 'bg-orange-100 text-orange-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">NFCシール注文管理</h1>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          更新
        </Button>
      </div>

      {/* 検索・フィルタ */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="注文ID、顧客名、メールアドレス、テナント名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="min-w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OneTapSealStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全てのステータス</option>
              <option value="pending">注文受付中</option>
              <option value="paid">支払い完了</option>
              <option value="preparing">準備中</option>
              <option value="shipped">発送済み</option>
              <option value="delivered">配送完了</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 注文一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span>読み込み中...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>注文が見つかりませんでした</p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                    {/* 注文ID・日時 */}
                    <div>
                      <div className="text-xs text-gray-500">注文ID</div>
                      <div className="font-mono text-sm">{order.id.slice(-12)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>

                    {/* 顧客情報 */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">顧客</div>
                      <div className="flex items-center space-x-2">
                        {order.orderType === 'corporate' ? (
                          <Building className="h-4 w-4 text-blue-600" />
                        ) : (
                          <User className="h-4 w-4 text-green-600" />
                        )}
                        <div>
                          <div className="font-medium text-sm">{order.user?.name || '未設定'}</div>
                          <div className="text-xs text-gray-600">{order.user?.email}</div>
                          {order.tenant?.name && (
                            <div className="text-xs text-blue-600">{order.tenant.name}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 金額・ステータス */}
                    <div>
                      <div className="text-xs text-gray-500">金額</div>
                      <div className="font-semibold">
                        &yen;{order.totalAmount.toLocaleString()}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                        >
                          {ONE_TAP_SEAL_STATUS_NAMES[order.status]}
                        </span>
                      </div>
                    </div>

                    {/* 配送先 */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">配送先</div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="text-xs">
                          <div className="font-medium">{order.shippingAddress?.recipientName}</div>
                          <div className="text-gray-600">
                            〒{order.shippingAddress?.postalCode}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* アクション */}
                  <div className="ml-4">
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      variant="outline"
                      size="sm"
                    >
                      詳細
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 注文詳細モーダル */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">注文詳細</h2>
                <Button
                  onClick={() => setSelectedOrder(null)}
                  variant="outline"
                  size="sm"
                >
                  閉じる
                </Button>
              </div>

              <div className="space-y-4">
                {/* 基本情報 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">注文ID</div>
                    <div className="font-mono text-sm">{selectedOrder.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">注文日</div>
                    <div className="text-sm">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">ステータス</div>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedOrder.status)}`}
                    >
                      {ONE_TAP_SEAL_STATUS_NAMES[selectedOrder.status]}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">注文タイプ</div>
                    <div className="text-sm">
                      {selectedOrder.orderType === 'corporate' ? '法人' : '個人'}
                    </div>
                  </div>
                </div>

                {/* 顧客情報 */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">顧客情報</h3>
                  <div className="text-sm">
                    <div>{selectedOrder.user?.name || '未設定'}</div>
                    <div className="text-gray-600">{selectedOrder.user?.email}</div>
                    {selectedOrder.tenant?.name && (
                      <div className="text-blue-600">テナント: {selectedOrder.tenant.name}</div>
                    )}
                  </div>
                </div>

                {/* シールアイテム */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">注文アイテム</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <div className="text-sm">
                          <span className="font-medium">
                            {item.color === 'black'
                              ? 'ブラック'
                              : item.color === 'gray'
                                ? 'グレー'
                                : 'ホワイト'}
                          </span>
                          <span className="text-gray-500 ml-2">x{item.quantity}</span>
                          <span className="text-gray-400 ml-2">slug: {item.profileSlug}</span>
                        </div>
                        <div className="text-sm font-medium">
                          &yen;{(item.unitPrice * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 金額 */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">金額</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>シール代金</span>
                      <span>&yen;{selectedOrder.sealTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>配送料</span>
                      <span>&yen;{selectedOrder.shippingFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>合計</span>
                      <span>&yen;{selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 配送先 */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">配送先</h3>
                  <div className="text-sm">
                    <div>{selectedOrder.shippingAddress?.recipientName}</div>
                    <div>〒{selectedOrder.shippingAddress?.postalCode}</div>
                    <div>{selectedOrder.shippingAddress?.address}</div>
                  </div>
                </div>

                {/* 追跡情報 */}
                {selectedOrder.trackingNumber && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-2">追跡情報</h3>
                    <div className="text-sm">
                      <div>追跡番号: {selectedOrder.trackingNumber}</div>
                      {selectedOrder.shippedAt && (
                        <div className="text-gray-600">
                          発送日: {new Date(selectedOrder.shippedAt).toLocaleDateString('ja-JP')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
