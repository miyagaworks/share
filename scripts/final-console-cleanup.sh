#!/bin/bash

# 最終的なconsole.*クリーンアップスクリプト

echo "🧹 最終console.*クリーンアップ開始..."

# コメントアウトされたconsole.*も含めて完全削除
find /Users/miyagawakiyomi/Projects/share -name "*.ts" -o -name "*.tsx" | \
    grep -v node_modules | \
    grep -v .next | \
    grep -v scripts | \
    grep -v debug | \
    grep -v logger.ts | \
    while read file; do
        
        # コメントアウトされたconsole.*も削除
        sed -i '' '/\/\/ console\./d' "$file"
        
        # 複数行コメントに含まれるconsole.*も削除
        sed -i '' '/^ *\* .*console\./d' "$file"
        sed -i '' '/^ *\/\* .*console\./d' "$file"
        
        # 空行になった行も削除
        sed -i '' '/^[[:space:]]*$/d' "$file"
    done

echo "✅ 最終クリーンアップ完了"

# 本当に残っているconsole.*をチェック（logger.ts、scripts、debugを除く）
echo "🔍 最終検証: 本番に影響するconsole.*残存数..."
remaining=$(find /Users/miyagawakiyomi/Projects/share -name "*.ts" -o -name "*.tsx" | \
    grep -v node_modules | \
    grep -v .next | \
    grep -v scripts | \
    grep -v debug | \
    grep -v logger.ts | \
    xargs grep -l "console\." | wc -l)

echo "残り: $remaining ファイル"

if [ "$remaining" -gt 0 ]; then
    echo "⚠️ まだconsole.*が残っているファイル（上位5件）:"
    find /Users/miyagawakiyomi/Projects/share -name "*.ts" -o -name "*.tsx" | \
        grep -v node_modules | \
        grep -v .next | \
        grep -v scripts | \
        grep -v debug | \
        grep -v logger.ts | \
        xargs grep -l "console\." | head -5 | while read file; do
            echo "  $file"
            grep -n "console\." "$file" | head -2
            echo ""
        done
else
    echo "🎉 すべてのconsole.*が適切に処理されました！"
fi