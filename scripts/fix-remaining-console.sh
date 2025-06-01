#!/bin/bash

# 残りのconsole.*を修正するスクリプト

echo "🚀 残りのconsole.*修正開始..."

# auth.tsとauth.config.tsを処理
echo "🔐 認証設定ファイル処理中..."
for file in /Users/miyagawakiyomi/Projects/share/auth.ts /Users/miyagawakiyomi/Projects/share/auth.config.ts; do
    if [ -f "$file" ]; then
        echo "  処理中: $file"
        
        # logger importを追加（NextAuth関連ファイルは慎重に処理）
        if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file"; then
            sed -i '' '1a\
import { logger } from "@/lib/utils/logger";
' "$file"
        fi
        
        # console.logをlogger.debugに変更
        sed -i '' 's/console\.log(/logger.debug(/g' "$file"
        
        # console.errorをlogger.errorに変更
        sed -i '' 's/console\.error(/logger.error(/g' "$file"
        
        # console.warnをlogger.warnに変更
        sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    fi
done

# middleware関連ファイルを処理
echo "🛡️ middleware処理中..."
find /Users/miyagawakiyomi/Projects/share/middleware -name "*.ts" -type f | while read file; do
    echo "  処理中: $file"
    
    # logger importを追加
    if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file"; then
        sed -i '' '1a\
import { logger } from "@/lib/utils/logger";
' "$file"
    fi
    
    # console.*をlogger.*に変更
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
done

# lib/utils/配下のファイル（logger.ts以外）を処理
echo "📚 lib/utils処理中..."
find /Users/miyagawakiyomi/Projects/share/lib/utils -name "*.ts" -type f ! -name "logger.ts" | while read file; do
    echo "  処理中: $file"
    
    # logger importを追加
    if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file" && ! grep -q "from.*logger" "$file"; then
        sed -i '' '1a\
import { logger } from "@/lib/utils/logger";
' "$file"
    fi
    
    # console.*をlogger.*に変更
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
done

# lib/corporateAccess/配下を処理
echo "🏢 lib/corporateAccess処理中..."
find /Users/miyagawakiyomi/Projects/share/lib/corporateAccess -name "*.ts" -type f | while read file; do
    echo "  処理中: $file"
    
    # logger importを追加
    if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file"; then
        sed -i '' '1a\
import { logger } from "@/lib/utils/logger";
' "$file"
    fi
    
    # console.*をlogger.*に変更
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
done

# lib/jikogene/配下を処理
echo "🤖 lib/jikogene処理中..."
find /Users/miyagawakiyomi/Projects/share/lib/jikogene -name "*.ts" -type f | while read file; do
    echo "  処理中: $file"
    
    # logger importを追加
    if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file"; then
        sed -i '' '1a\
import { logger } from "@/lib/utils/logger";
' "$file"
    fi
    
    # console.*をlogger.*に変更
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
done

# その他のlibファイルを処理
echo "📖 その他のlibファイル処理中..."
for file in /Users/miyagawakiyomi/Projects/share/lib/stripe.ts /Users/miyagawakiyomi/Projects/share/lib/stripeClient.ts /Users/miyagawakiyomi/Projects/share/lib/db-manager.ts /Users/miyagawakiyomi/Projects/share/lib/errorHandler.ts; do
    if [ -f "$file" ]; then
        echo "  処理中: $file"
        
        # logger importを追加
        if ! grep -q "import.*logger.*from.*@/lib/utils/logger" "$file"; then
            sed -i '' '1a\
import { logger } from "@/lib/utils/logger";
' "$file"
        fi
        
        # console.*をlogger.*に変更
        sed -i '' 's/console\.log(/logger.debug(/g' "$file"
        sed -i '' 's/console\.error(/logger.error(/g' "$file"
        sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
        sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
        sed -i '' 's/console\.info(/logger.info(/g' "$file"
    fi
done

echo "✅ 残りのファイル処理完了"

# 最終チェック
echo "🔍 最終チェック: 残りのconsole.*使用箇所..."
remaining=$(find /Users/miyagawakiyomi/Projects/share -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -name "*.d.ts" -exec grep -l "console\." {} \; | wc -l)
echo "残り: $remaining ファイル"

if [ "$remaining" -gt 0 ]; then
    echo "⚠️ 以下のファイルに未処理のconsole.*があります:"
    find /Users/miyagawakiyomi/Projects/share -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -name "*.d.ts" -exec grep -l "console\." {} \;
fi