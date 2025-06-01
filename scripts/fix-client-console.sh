#!/bin/bash

# クライアントサイドのconsole.*を修正するスクリプト

echo "🎯 クライアントサイドのconsole.*修正開始..."

# hooksディレクトリを処理
echo "🎣 hooks処理中..."
find /Users/miyagawakiyomi/Projects/share/hooks -name "*.ts" -type f | while read file; do
    echo "  処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.infoを削除
    sed -i '' '/console\.info(/d' "$file"
    
    # console.errorをコメントアウト（手動で確認が必要）
    sed -i '' 's/.*console\.error(/    \/\/ console.error(/g' "$file"
done

# actionsディレクトリを処理
echo "⚡ actions処理中..."
find /Users/miyagawakiyomi/Projects/share/actions -name "*.ts" -type f | while read file; do
    echo "  処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.infoを削除
    sed -i '' '/console\.info(/d' "$file"
    
    # console.errorをコメントアウト（手動で確認が必要）
    sed -i '' 's/.*console\.error(/    \/\/ console.error(/g' "$file"
done

# 残りのmiddleware.tsを処理
echo "🛡️ middleware.ts残り処理中..."
if [ -f "/Users/miyagawakiyomi/Projects/share/middleware.ts" ]; then
    file="/Users/miyagawakiyomi/Projects/share/middleware.ts"
    echo "  処理中: $file"
    
    # 残っているconsole.*があれば修正
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
fi

echo "✅ クライアントサイド処理完了"

# scriptsディレクトリは除外（管理用スクリプトのため）
echo "📝 注意: scriptsディレクトリは管理用のため処理をスキップ"

# 最終チェック（scriptsとdebugを除く）
echo "🔍 最終チェック: 残りのconsole.*使用箇所（scripts/debug除く）..."
remaining=$(find /Users/miyagawakiyomi/Projects/share -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/scripts/*" -not -path "*/debug/*" -not -name "*.d.ts" -not -name "logger.ts" -exec grep -l "console\." {} \; | wc -l)
echo "残り: $remaining ファイル"

if [ "$remaining" -gt 0 ]; then
    echo "⚠️ 以下のファイルに未処理のconsole.*があります:"
    find /Users/miyagawakiyomi/Projects/share -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/scripts/*" -not -path "*/debug/*" -not -name "*.d.ts" -not -name "logger.ts" -exec grep -l "console\." {} \;
fi