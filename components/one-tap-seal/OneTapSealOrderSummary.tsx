// components/one-tap-seal/OneTapSealOrderSummary.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreditCard, Edit, MapPin, Package, Link, Loader2, X } from 'lucide-react';
import {
  ONE_TAP_SEAL_COLOR_NAMES,
  ONE_TAP_SEAL_CONFIG,
  type OneTapSealSelection,
  type EnhancedShippingAddress,
} from '@/types/one-tap-seal';
import { calculateOrderAmount } from '@/lib/one-tap-seal/order-calculator';

interface OneTapSealOrderSummaryProps {
  items: OneTapSealSelection;
  profileSlug: string; // qrSlug → profileSlug に変更
  shippingAddress: EnhancedShippingAddress;
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

export function OneTapSealOrderSummary({
  items,
  profileSlug, // qrSlug → profileSlug に変更
  shippingAddress,
  onConfirm,
  onEdit,
  isSubmitting,
}: OneTapSealOrderSummaryProps) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 注文内容の計算
  const orderItems = Object.entries(items)
    .filter(([_, quantity]) => quantity > 0)
    .map(([color, quantity]) => ({
      color: color as keyof OneTapSealSelection,
      quantity,
      unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
      profileSlug, // qrSlug → profileSlug に変更
    }));

  const calculation = calculateOrderAmount(orderItems);

  // 完全な住所を組み立て
  const formatFullAddress = () => {
    let fullAddress = shippingAddress.address;
    if (shippingAddress.building) {
      fullAddress += ` ${shippingAddress.building}`;
    }
    return fullAddress;
  };

  // Googleマップ用のURLを生成（本番環境対応版）
  const getGoogleMapsUrl = () => {
    const fullAddress = `〒${shippingAddress.postalCode} ${formatFullAddress()}`;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // APIキーが設定されていない場合の処理
    if (!apiKey) {
      console.error('Google Maps API key is not set');
      return null;
    }

    // searchモードを使用してマーカーを表示
    return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(fullAddress)}&language=ja&region=JP&zoom=16`;
  };

  // 住所確認モーダル（エラーハンドリング対応版）
  const AddressConfirmationModal = () => {
    const mapUrl = getGoogleMapsUrl();

    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">お届け先住所の確認</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAddressModal(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            {mapUrl ? (
              <iframe
                src={mapUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
                onError={(e) => {
                  console.error('Google Maps iframe error:', e);
                }}
              />
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">地図を読み込めませんでした</p>
                  <Button
                    onClick={() => {
                      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`〒${shippingAddress.postalCode} ${formatFullAddress()}`)}`;
                      window.open(searchUrl, '_blank', 'noopener,noreferrer');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Googleマップで開く
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                上記の地図で正しい住所が表示されているかご確認ください。
                <br />
                地図が正確でない場合は、住所を修正してください。
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={() => setShowAddressModal(false)}>
              閉じる
            </Button>
            <Button onClick={onEdit}>住所を修正</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">注文内容確認</h3>
        </div>

        <div className="space-y-6">
          {/* 商品情報 */}
          <div>
            <h4 className="font-medium flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                ご注文商品
              </div>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-3 w-3 mr-1" />
                編集
              </Button>
            </h4>
            <div className="space-y-2">
              {Object.entries(items)
                .filter(([_, quantity]) => quantity > 0)
                .map(([color, quantity]) => (
                  <div
                    key={color}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border ${
                          color === 'black'
                            ? 'bg-black border-gray-300'
                            : color === 'gray'
                              ? 'bg-gray-400 border-gray-300'
                              : 'bg-white border-2 border-gray-300'
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {ONE_TAP_SEAL_COLOR_NAMES[color as keyof typeof ONE_TAP_SEAL_COLOR_NAMES]}
                      </span>
                      <span className="text-sm text-gray-600">× {quantity}枚</span>
                    </div>
                    <span className="text-sm font-medium">
                      ¥{(quantity * ONE_TAP_SEAL_CONFIG.UNIT_PRICE).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>

            {/* URL情報 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">設定URL:</span>
                <span className="text-sm text-blue-700">app.sns-share.com/{profileSlug}</span>{' '}
                {/* /qr/ を削除、qrSlug → profileSlug に変更 */}
              </div>
            </div>
          </div>

          {/* 配送先情報 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center mb-3">
                <MapPin className="h-4 w-4 mr-2" />
                お届け先
              </h4>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-20 text-gray-600">郵便番号:</span>
                <span>{shippingAddress.postalCode}</span>
              </div>
              <div className="flex">
                <span className="w-20 text-gray-600">住所:</span>
                <span>{formatFullAddress()}</span>
              </div>
              {shippingAddress.companyName && (
                <div className="flex">
                  <span className="w-20 text-gray-600">会社名:</span>
                  <span>{shippingAddress.companyName}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-20 text-gray-600">宛先:</span>
                <span>{shippingAddress.recipientName}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddressModal(true)}
              className="mt-2"
            >
              <MapPin className="h-3 w-3 mr-1" />
              地図で確認
            </Button>
          </div>

          {/* 料金詳細 */}
          <div>
            <h4 className="font-medium mb-3">料金詳細</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>商品代金（{calculation.itemCount}枚）</span>
                <span>¥{calculation.sealTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>配送料</span>
                <span>¥{calculation.shippingFee.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>合計（税込）</span>
                <span>¥{calculation.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 確認ボタン */}
        <div className="mt-6 pt-4 border-t">
          <Button onClick={onConfirm} disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                注文を作成中...
              </>
            ) : (
              '注文を確定して決済へ進む'
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            注文確定後、Stripe決済画面に移動します
          </p>
        </div>
      </Card>

      {/* 住所確認モーダル */}
      {showAddressModal && <AddressConfirmationModal />}
    </div>
  );
}