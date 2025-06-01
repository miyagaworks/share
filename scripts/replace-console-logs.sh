#!/bin/bash

# 本番環境向けconsole.*置き換えスクリプト

echo "🚀 本番環境向けconsole.*置き換え開始..."

# APIルートディレクトリ内のファイルを処理
find /Users/miyagawakiyomi/Projects/share/app/api -name "*.ts" -type f | while read file; do
    echo "処理中: $file"
    
    # logger importが存在するかチェック
    if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file"; then
        # logger importを追加（prismaのimportの後に挿入）
        if grep -q "import.*prisma" "$file"; then
            sed -i '' '/import.*prisma.*;$/a\
import { logger } from "@/lib/utils/logger";
' "$file"
        elif grep -q "import.*auth" "$file"; then
            sed -i '' '/import.*auth.*;$/a\
import { logger } from "@/lib/utils/logger";
' "$file"
        elif grep -q "import.*NextResponse" "$file"; then
            sed -i '' '/import.*NextResponse.*;$/a\
import { logger } from "@/lib/utils/logger";
' "$file"
        fi
    fi
    
    # console.logを適切なlogger.debugまたはlogger.infoに置き換え
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    
    # console.errorをlogger.errorに置き換え
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    
    # console.warnをlogger.warnに置き換え
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    
    # console.debugをlogger.debugに置き換え
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    
    # console.infoをlogger.infoに置き換え
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
done

echo "✅ APIルート処理完了"

# ダッシュボードページを処理
find /Users/miyagawakiyomi/Projects/share/app/dashboard -name "*.tsx" -type f | while read file; do
    echo "処理中: $file"
    
    # console.logを削除または開発環境限定に変更
    sed -i '' '/console\.log(/d' "$file"
    
    # console.errorはlogger.errorに置き換え（importが必要な場合は手動で追加）
    sed -i '' 's/console\.error(/\/\/ TODO: logger.error(/g' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
done

echo "✅ ダッシュボードページ処理完了"

# 認証ページを処理
find /Users/miyagawakiyomi/Projects/share/app/auth -name "*.tsx" -type f | while read file; do
    echo "処理中: $file"
    
    # console.logを削除
    sed -i '' '/console\.log(/d' "$file"
    
    # console.errorをコメントアウト（手動で確認が必要）
    sed -i '' 's/console\.error(/\/\/ TODO: logger.error(/g' "$file"
    
    # console.warnを削除
    sed -i '' '/console\.warn(/d' "$file"
    
    # console.debugを削除
    sed -i '' '/console\.debug(/d' "$file"
done

echo "✅ 認証ページ処理完了"

echo "🎉 console.*置き換え完了"
echo "⚠️  注意: 手動でlogger importの追加が必要な場合があります"
echo "⚠️  注意: TODOコメントになったconsole.errorは手動で確認してください"