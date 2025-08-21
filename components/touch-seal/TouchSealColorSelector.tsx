// components/touch-seal/TouchSealColorSelector.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Minus } from 'lucide-react';
import {
  TOUCH_SEAL_COLORS,
  TOUCH_SEAL_COLOR_NAMES,
  TOUCH_SEAL_CONFIG,
  type TouchSealColor,
} from '@/types/touch-seal';

interface TouchSealColorSelectorProps {
  items: Record<TouchSealColor, number>;
  onItemsChange: (items: Record<TouchSealColor, number>) => void;
  disabled?: boolean;
}

export function TouchSealColorSelector({
  items,
  onItemsChange,
  disabled = false,
}: TouchSealColorSelectorProps) {
  // 数量変更ハンドラ
  const handleQuantityChange = (color: TouchSealColor, delta: number) => {
    const currentQuantity = items[color];
    const newQuantity = Math.max(
      0,
      Math.min(TOUCH_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR, currentQuantity + delta),
    );

    // 合計数量制限チェック
    const currentTotal = Object.values(items).reduce((sum, qty) => sum + qty, 0);
    const newTotal = currentTotal - currentQuantity + newQuantity;

    if (newTotal > TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY && delta > 0) {
      return; // 合計制限を超える場合は変更しない
    }

    onItemsChange({
      ...items,
      [color]: newQuantity,
    });
  };

  // 直接数値入力ハンドラ
  const handleDirectInput = (color: TouchSealColor, value: string) => {
    const quantity = parseInt(value) || 0;
    const clampedQuantity = Math.max(
      0,
      Math.min(TOUCH_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR, quantity),
    );

    // 合計数量制限チェック
    const currentTotal = Object.values(items).reduce((sum, qty) => sum + qty, 0);
    const newTotal = currentTotal - items[color] + clampedQuantity;

    if (newTotal <= TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY) {
      onItemsChange({
        ...items,
        [color]: clampedQuantity,
      });
    }
  };

  // 色のスタイル取得
  const getColorStyle = (color: TouchSealColor) => {
    switch (color) {
      case 'black':
        return 'bg-black border-gray-300';
      case 'gray':
        return 'bg-gray-400 border-gray-300';
      case 'white':
        return 'bg-white border-gray-300 border-2';
      default:
        return 'bg-gray-200 border-gray-300';
    }
  };

  // 合計数量と金額計算
  const totalQuantity = Object.values(items).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = totalQuantity * TOUCH_SEAL_CONFIG.UNIT_PRICE;

  return (
    <div className="space-y-4">
      {/* カラー選択 */}
      <div className="space-y-3">
        {TOUCH_SEAL_COLORS.map((color) => (
          <Card key={color} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                {/* カラーサンプル - 小さくて正円 */}
                <div className={`w-6 h-6 rounded-full border ${getColorStyle(color)}`} />

                <div className="flex-1">
                  <div className="font-medium">{TOUCH_SEAL_COLOR_NAMES[color]}</div>
                  <div className="text-sm text-gray-500">
                    ¥{TOUCH_SEAL_CONFIG.UNIT_PRICE.toLocaleString()} / 枚
                  </div>
                </div>
              </div>

              {/* 数量コントロール - 幅を狭く */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(color, -1)}
                  disabled={disabled || items[color] === 0}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <input
                  type="number"
                  value={items[color]}
                  onChange={(e) => handleDirectInput(color, e.target.value)}
                  min="0"
                  max={TOUCH_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR}
                  disabled={disabled}
                  className="w-14 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(color, 1)}
                  disabled={
                    disabled ||
                    items[color] >= TOUCH_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR ||
                    totalQuantity >= TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY
                  }
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 小計表示 */}
            {items[color] > 0 && (
              <div className="mt-2 text-right text-sm text-gray-600">
                小計: ¥{(items[color] * TOUCH_SEAL_CONFIG.UNIT_PRICE).toLocaleString()}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* 合計表示 */}
      <Card className="p-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600">合計数量</div>
            <div className="font-medium">
              {totalQuantity} 枚
              {totalQuantity > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  / {TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY} 枚まで
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600">商品合計</div>
            <div className="text-lg font-bold">¥{totalPrice.toLocaleString()}</div>
          </div>
        </div>

        {/* 制限警告 */}
        {totalQuantity >= TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY && (
          <div className="mt-2 text-xs text-orange-600">⚠️ 最大注文数に達しています</div>
        )}
      </Card>

      {/* 注意事項 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 1色あたり最大{TOUCH_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR}枚まで注文可能</p>
        <p>• 合計最大{TOUCH_SEAL_CONFIG.MAX_TOTAL_QUANTITY}枚まで注文可能</p>
        <p>• 価格は税込表示です</p>
      </div>
    </div>
  );
}