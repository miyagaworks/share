#!/bin/bash

# フロントエンド用のconsole.*削除スクリプト

echo "🎯 フロントエンドのconsole.*削除開始..."

# ダッシュボードページのconsole.logを削除
echo "🗂️ ダッシュボードページ処理中..."
find /Users/miyagawakiyomi/Projects/share/app/dashboard -name "*.tsx" -type f | while read file; do
    echo "  処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.errorをコメントアウト
    sed -i '' 's/.*console\.error(/    \/\/ console.error(/g' "$file"
    
    # console.infoを削除
    sed -i '' '/console\.info(/d' "$file"
done

# 認証ページの処理
echo "🔐 認証ページ処理中..."
find /Users/miyagawakiyomi/Projects/share/app/auth -name "*.tsx" -type f | while read file; do
    echo "  処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.errorをコメントアウト
    sed -i '' 's/.*console\.error(/    \/\/ console.error(/g' "$file"
    
    # console.infoを削除
    sed -i '' '/console\.info(/d' "$file"
done

# コンポーネントの処理
echo "🧩 コンポーネント処理中..."
find /Users/miyagawakiyomi/Projects/share/components -name "*.tsx" -type f | while read file; do
    echo "  処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.errorをコメントアウト
    sed -i '' 's/.*console\.error(/    \/\/ console.error(/g' "$file"
    
    # console.infoを削除
    sed -i '' '/console\.info(/d' "$file"
done

# hooksの処理
echo "🎣 hooks処理中..."
find /Users/miyagawakiyomi/Projects/share/hooks -name "*.ts" -type f | while read file; do
    echo "  処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.errorをコメントアウト
    sed -i '' 's/.*console\.error(/    \/\/ console.error(/g' "$file"
    
    # console.infoを削除
    sed -i '' '/console\.info(/d' "$file"
done

# actionsの処理
echo "⚡ actions処理中..."
find /Users/miyagawakiyomi/Projects/share/actions -name "*.ts" -type f | while read file; do
    echo "  処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.errorをコメントアウト
    sed -i '' 's/.*console\.error(/    \/\/ console.error(/g' "$file"
    
    # console.infoを削除
    sed -i '' '/console\.info(/d' "$file"
done

echo "✅ フロントエンドのconsole.*削除完了"
echo "⚠️  注意: 空行が残る場合があります"
echo "⚠️  注意: コメントアウトされたconsole.errorは手動で確認してください"