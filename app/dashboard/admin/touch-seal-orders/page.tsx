// app/dashboard/admin/touch-seal-orders/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Package, Search, Truck, MapPin, User, Building } from 'lucide-react';
import {
  TOUCH_SEAL_STATUS_NAMES,
  TOUCH_SEAL_COLOR_NAMES,
  type TouchSealStatus,
  type TouchSealOrder,
} from '@/types/touch-seal';

export default function TouchSealOrdersPage() {
  const [orders, setOrders] = useState<TouchSealOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<TouchSealOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TouchSealStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<TouchSealOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 注文データを取得
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/admin/touch-seal/orders');
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
    };

    fetchOrders();
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = orders;

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // 検索フィルター
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

  // ステータス更新
  const updateOrderStatus = async (orderId: string, newStatus: TouchSealStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/touch-seal/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
        );
        toast.success('ステータスを更新しました');
      } else {
        throw new Error('ステータス更新に失敗しました');
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      toast.error('ステータス更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 追跡番号更新
  const updateTrackingNumber = async (orderId: string, tracking: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/touch-seal/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: tracking, status: 'shipped' }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, trackingNumber: tracking, status: 'shipped' as TouchSealStatus }
              : order,
          ),
        );
        toast.success('追跡番号を更新し、発送完了メールを送信しました');
        setSelectedOrder(null);
        setTrackingNumber('');
      } else {
        throw new Error('追跡番号更新に失敗しました');
      }
    } catch (error) {
      console.error('追跡番号更新エラー:', error);
      toast.error('追跡番号更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">注文データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タッチシール注文管理</h1>
          <p className="text-gray-600 mt-1">注文の管理と配送状況の更新</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {filteredOrders.length} / {orders.length} 件の注文
          </div>
        </div>
      </div>

      {/* フィルター */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="注文ID、顧客名、会社名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TouchSealStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全てのステータス</option>
              {Object.entries(TOUCH_SEAL_STATUS_NAMES).map(([status, name]) => (
                <option key={status} value={status}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 注文一覧 */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">注文が見つかりません</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? '検索条件を変更してお試しください'
              : 'まだ注文がありません'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* 注文情報 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">注文 #{order.id.slice(-8)}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'paid'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'preparing'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'shipped'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {TOUCH_SEAL_STATUS_NAMES[order.status]}
                    </span>
                    {order.orderType === 'corporate' && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                        法人注文
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {/* 顧客情報 */}
                    <div className="flex items-center gap-2">
                      {order.orderType === 'corporate' ? (
                        <Building className="h-4 w-4 text-gray-400" />
                      ) : (
                        <User className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        {order.tenant?.name && (
                          <div className="font-medium">{order.tenant.name}</div>
                        )}
                        <div className="text-gray-600">{order.user?.email}</div>
                      </div>
                    </div>

                    {/* 配送先 */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">{order.shippingAddress.recipientName}</div>
                        <div className="text-gray-600">
                          〒{order.shippingAddress.postalCode}
                          <br />
                          {order.shippingAddress.address}
                        </div>
                      </div>
                    </div>

                    {/* 注文内容 */}
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)}枚
                        </div>
                        <div className="text-gray-600">
                          {order.items.map((item) => (
                            <div key={item.id}>
                              {TOUCH_SEAL_COLOR_NAMES[item.color]} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 注文日時・金額 */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <span>注文日: {new Date(order.orderDate).toLocaleDateString('ja-JP')}</span>
                    <span>金額: ¥{order.totalAmount.toLocaleString()}</span>
                    {order.trackingNumber && <span>追跡番号: {order.trackingNumber}</span>}
                  </div>
                </div>

                {/* アクション */}
                <div className="flex flex-col gap-2 lg:w-48">
                  {order.status === 'paid' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      disabled={isUpdating}
                      size="sm"
                      className="w-full"
                    >
                      準備中に変更
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      disabled={isUpdating}
                      size="sm"
                      className="w-full"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      発送処理
                    </Button>
                  )}
                  {order.status === 'shipped' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      disabled={isUpdating}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      配送完了
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 発送処理モーダル */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">発送処理</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">追跡番号</label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="クリックポスト追跡番号"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => updateTrackingNumber(selectedOrder.id, trackingNumber)}
                  disabled={!trackingNumber || isUpdating}
                  className="flex-1"
                >
                  発送完了
                </Button>
                <Button
                  onClick={() => {
                    setSelectedOrder(null);
                    setTrackingNumber('');
                  }}
                  variant="outline"
                  disabled={isUpdating}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}