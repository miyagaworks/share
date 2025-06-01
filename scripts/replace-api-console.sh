#!/bin/bash

# APIルート用console.*置き換えスクリプト

echo "🚀 APIルートのconsole.*置き換え開始..."

# APIルート内のすべてのTypeScriptファイルを処理
find /Users/miyagawakiyomi/Projects/share/app/api -name "*.ts" -type f | while read file; do
    echo "処理中: $file"
    
    # logger importが存在するかチェック
    if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file"; then
        # logger importを追加（最適な位置を選択）
        if grep -q "import.*NextResponse" "$file"; then
            # NextResponseのimportの後に追加
            sed -i '' '/import.*NextResponse.*;$/a\
import { logger } from "@/lib/utils/logger";
' "$file"
        elif grep -q "import.*auth" "$file"; then
            # authのimportの後に追加
            sed -i '' '/import.*auth.*;$/a\
import { logger } from "@/lib/utils/logger";
' "$file"
        elif grep -q "import.*prisma" "$file"; then
            # prismaのimportの後に追加
            sed -i '' '/import.*prisma.*;$/a\
import { logger } from "@/lib/utils/logger";
' "$file"
        else
            # どのimportも見つからない場合、最初のimportの後に追加
            sed -i '' '1,/^import.*$/s//&\
import { logger } from "@/lib/utils/logger";/' "$file"
        fi
    fi
    
    # console.logをlogger.debugまたはlogger.infoに置き換え
    # 一般的なログはdebugレベル、重要な処理はinfoレベル
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    
    # console.errorをlogger.errorに置き換え
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    
    # console.warnをlogger.warnに置き換え
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    
    # console.debugをlogger.debugに置き換え
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    
    # console.infoをlogger.infoに置き換え
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
    
    # テストやデバッグ用のファイルは除外
    if [[ "$file" == *"/test/"* ]] || [[ "$file" == *"/debug"* ]]; then
        echo "  テスト/デバッグファイルのため処理をスキップ: $file"
        continue
    fi
done

echo "✅ APIルートのconsole.*置き換え完了"

# 残りのconsole.*をチェック
echo "🔍 残りのconsole.*使用箇所をチェック..."
remaining_count=$(find /Users/miyagawakiyomi/Projects/share/app/api -name "*.ts" -type f -exec grep -l "console\." {} \; | wc -l)
echo "残り: $remaining_count ファイル"

if [ "$remaining_count" -gt 0 ]; then
    echo "⚠️  以下のファイルに未処理のconsole.*があります:"
    find /Users/miyagawakiyomi/Projects/share/app/api -name "*.ts" -type f -exec grep -l "console\." {} \;
fi