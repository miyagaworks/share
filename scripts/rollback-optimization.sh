#!/bin/bash

echo "🔄 最適化をロールバックします..."

if [ -f app/dashboard/layout.tsx.backup ]; then
    cp app/dashboard/layout.tsx.backup app/dashboard/layout.tsx
    echo "✅ 元のレイアウトに戻しました"
else
    echo "❌ バックアップファイルが見つかりません"
fi