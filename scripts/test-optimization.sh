#!/bin/bash

echo "🧪 最適化テストを開始します..."

# 元のレイアウトファイルをバックアップ
if [ ! -f app/dashboard/layout.tsx.backup ]; then
    echo "💾 バックアップを作成中..."
    cp app/dashboard/layout.tsx app/dashboard/layout.tsx.backup
fi

# 最適化版に切り替え
echo "🚀 最適化版レイアウトに切り替え..."
cp app/dashboard/layout-optimized.tsx app/dashboard/layout.tsx

echo "✅ 最適化レイアウトを適用しました"
echo "📊 以下のURLでテストしてください:"
echo "   - http://localhost:3000/dashboard"
echo "   - http://localhost:3000/dashboard/profile"
echo "   - http://localhost:3000/dashboard/corporate-member (法人ユーザーの場合)"

echo ""
echo "🔄 元に戻すには:"
echo "   cp app/dashboard/layout.tsx.backup app/dashboard/layout.tsx"