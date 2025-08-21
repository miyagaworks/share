// components/touch-seal/TouchSealOrderSummary.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreditCard, Edit, MapPin, Package, Link, Loader2, X } from 'lucide-react';
import {
  TOUCH_SEAL_COLOR_NAMES,
  TOUCH_SEAL_CONFIG,
  type TouchSealSelection,
  type EnhancedShippingAddress,
} from '@/types/touch-seal';
import { calculateOrderAmount } from '@/lib/touch-seal/order-calculator';

interface TouchSealOrderSummaryProps {
  items: TouchSealSelection;
  qrSlug: string;
  shippingAddress: EnhancedShippingAddress;
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

export function TouchSealOrderSummary({
  items,
  qrSlug,
  shippingAddress,
  onConfirm,
  onEdit,
  isSubmitting,
}: TouchSealOrderSummaryProps) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 注文内容の計算
  const orderItems = Object.entries(items)
    .filter(([_, quantity]) => quantity > 0)
    .map(([color, quantity]) => ({
      color: color as keyof TouchSealSelection,
      quantity,
      unitPrice: TOUCH_SEAL_CONFIG.UNIT_PRICE,
      qrSlug,
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

  // Googleマップ用のURLを生成
  const getGoogleMapsUrl = () => {
    const fullAddress = formatFullAddress();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  // 住所確認モーダル
  const AddressConfirmationModal = () => (
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
          {/* 住所情報 */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">お届け先情報</h4>
            <div className="space-y-1 text-sm">
              <p>
                <strong>郵便番号:</strong> {shippingAddress.postalCode}
              </p>
              <p>
                <strong>住所:</strong> {formatFullAddress()}
              </p>
              {shippingAddress.companyName && (
                <p>
                  <strong>会社名:</strong> {shippingAddress.companyName}
                </p>
              )}
              <p>
                <strong>お届け先名:</strong> {shippingAddress.recipientName}
              </p>
            </div>
          </div>

          {/* Googleマップ埋め込み */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">地図で住所を確認</h4>
            <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden border">
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <iframe
                  src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(formatFullAddress())}&zoom=17&maptype=roadmap&language=ja&region=JP`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="配送先住所の地図"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-6">
                  <MapPin className="h-16 w-16 mb-4 text-gray-400" />
                  <h5 className="font-medium mb-2">住所確認</h5>
                  <div className="text-center space-y-2 mb-4">
                    <p className="text-sm font-medium text-gray-700">{formatFullAddress()}</p>
                    <p className="text-xs text-gray-500">郵便番号: {shippingAddress.postalCode}</p>
                  </div>

                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
                    >
                      🗺️ Googleマップで確認
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/search?q=${encodeURIComponent(formatFullAddress())}`,
                          '_blank',
                        )
                      }
                    >
                      🔍 Google検索で確認
                    </Button>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    住所に間違いがないか必ず確認してください
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 注意事項 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 配送前の最終確認</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• 住所に間違いがないか地図で確認してください</li>
              <li>• クリックポストは郵便受けに投函されます</li>
              <li>• 表札やポストに記載の名前と受取人名が一致していることを確認してください</li>
              <li>• マンション・アパートの場合は部屋番号が正しいか確認してください</li>
            </ul>
          </div>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowAddressModal(false)} className="flex-1">
              住所を修正する
            </Button>
            <Button
              onClick={() => {
                setShowAddressModal(false);
                // 少し遅延させて確認後に注文確定
                setTimeout(() => onConfirm(), 100);
              }}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  注文作成中...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  住所確認完了 - 注文を確定する
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">注文内容確認</h3>
        </div>

        <div className="space-y-6">
          {/* 商品情報 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                ご注文商品
              </h4>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-3 w-3 mr-1" />
                編集
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(items)
                .filter(([_, quantity]) => quantity > 0)
                .map(([color, quantity]) => (
                  <div
                    key={color}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
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
                        {TOUCH_SEAL_COLOR_NAMES[color as keyof typeof TOUCH_SEAL_COLOR_NAMES]}
                      </span>
                      <span className="text-sm text-gray-600">× {quantity}枚</span>
                    </div>
                    <span className="text-sm font-medium">
                      ¥{(quantity * TOUCH_SEAL_CONFIG.UNIT_PRICE).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>

            {/* URL情報 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">設定URL:</span>
                <span className="text-sm text-blue-700">app.share-sns.com/qr/{qrSlug}</span>
              </div>
            </div>
          </div>

          {/* 配送先情報 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                お届け先
              </h4>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-3 w-3 mr-1" />
                編集
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">郵便番号:</span>
                <span className="ml-2">{shippingAddress.postalCode}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">住所:</span>
                <span className="ml-2">{formatFullAddress()}</span>
              </div>
              {shippingAddress.companyName && (
                <div className="text-sm">
                  <span className="text-gray-600">会社名:</span>
                  <span className="ml-2">{shippingAddress.companyName}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-gray-600">お届け先名:</span>
                <span className="ml-2">{shippingAddress.recipientName}</span>
              </div>
            </div>
          </div>

          {/* 金額明細 */}
          <div>
            <h4 className="font-medium mb-3">お支払い金額</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>商品代金 ({calculation.itemCount}枚)</span>
                <span>¥{calculation.sealTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>配送料</span>
                <span>¥{calculation.shippingFee.toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>合計金額（税込）</span>
                <span>¥{calculation.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 配送に関する注意事項 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📦 配送について</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• クリックポストでお届けします（追跡番号付き）</li>
              <li>• ポストへの投函となります（対面受取不要）</li>
              <li>• 発送後1-3営業日でお届け予定です</li>
              <li>• 発送時にメールで追跡番号をお知らせします</li>
            </ul>
          </div>

          {/* 確認ボタン */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onEdit} className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              内容を修正する
            </Button>

            <Button
              onClick={() => setShowAddressModal(true)}
              className="flex-1"
              disabled={isSubmitting}
            >
              <MapPin className="h-4 w-4 mr-2" />
              住所を地図で確認して注文確定
            </Button>
          </div>
        </div>
      </Card>

      {/* 住所確認モーダル */}
      {showAddressModal && <AddressConfirmationModal />}
    </>
  );
}