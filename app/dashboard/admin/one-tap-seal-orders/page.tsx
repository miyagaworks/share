// app/dashboard/admin/one-tap-seal-orders/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Package, Search, Truck, MapPin, User, Building, Eye, Loader2 } from 'lucide-react';
import {
  ONE_TAP_SEAL_STATUS_NAMES,
  type OneTapSealStatus,
  type OneTapSealOrder,
} from '@/types/one-tap-seal';
import { OneTapSealOrderDetailModal } from '@/components/admin/OneTapSealOrderDetailModal';

export default function OneTapSealOrdersPage() {
  const [orders, setOrders] = useState<OneTapSealOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OneTapSealOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OneTapSealStatus | 'all'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // 注文データを取得
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/one-tap-seal/orders');
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

  // 注文詳細を開く
  const openOrderDetail = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
  }, []);

  // 注文詳細を閉じる
  const closeOrderDetail = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  // 注文更新後のコールバック
  const handleOrderUpdate = useCallback(() => {
    fetchOrders(); // 注文リストを再取得
  }, [fetchOrders]);

  return (
    <div className="container mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">ワンタップシール注文管理</h1>
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
                placeholder="注文ID、顧客名、メールアドレスで検索..."
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
              <option value="paid">注文受付中</option>
              <option value="preparing">準備中</option>
              <option value="shipped">発送済み</option>
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
            <Card className="p-8 text-center text-gray-500">注文が見つかりませんでした</Card>
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
                        </div>
                      </div>
                    </div>

                    {/* 金額・ステータス */}
                    <div>
                      <div className="text-xs text-gray-500">金額</div>
                      <div className="font-semibold">¥{order.totalAmount.toLocaleString()}</div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
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
                          <div className="text-gray-600">〒{order.shippingAddress?.postalCode}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* アクション */}
                  <div className="ml-4">
                    <Button onClick={() => openOrderDetail(order.id)} variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
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
      {selectedOrderId && (
        <OneTapSealOrderDetailModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={closeOrderDetail}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
}