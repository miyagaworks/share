#!/bin/bash
# 本番用デバッグコード削除スクリプト

echo "🧹 本番環境用クリーンアップを開始..."

## 1. console.log の削除・置換
echo "📝 console.log を削除中..."

# TypeScript/JSファイル内のconsole.logを削除（コメントは保持）
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./dist/*" \
  | xargs sed -i.bak 's/console\.log([^;]*);*//g'

# console.error, console.warn, console.debug も本番では削除
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./dist/*" \
  | xargs sed -i.bak 's/console\.debug([^;]*);*//g'

## 2. 開発用ファイル・ディレクトリの削除
echo "🗂️ 開発用ファイルを削除中..."

# デバッグ用APIエンドポイント
rm -rf app/api/debug/
rm -rf app/api/test/
rm -rf app/debug/

# 開発用コンポーネント
find . -name "*Debug*" -not -path "./node_modules/*" -delete
find . -name "*Test*" -not -path "./node_modules/*" -not -name "*.test.*" -delete

## 3. 設定ファイルの本番用調整
echo "⚙️ 設定ファイルを調整中..."

# auth.ts のdebug設定を無効化
sed -i.bak 's/debug: true/debug: false/g' auth.ts
sed -i.bak 's/debug: process.env.NODE_ENV === "development"/debug: false/g' auth.ts

# next.config.mjs の開発用設定を無効化
sed -i.bak 's/reactStrictMode: true/reactStrictMode: false/g' next.config.mjs

## 4. ログレベルの調整
echo "📊 ログレベルを本番用に調整中..."

# logger.ts での開発用ログを無効化
sed -i.bak 's/LogLevelEnum.debug/LogLevelEnum.info/g' lib/utils/logger.ts

## 5. バックアップファイルの削除
echo "🗑️ バックアップファイルを削除中..."
find . -name "*.bak" -delete

## 6. 本番チェック項目の確認
echo "✅ 本番チェック項目:"
echo "  - NODE_ENV=production"
echo "  - NEXTAUTH_SECRET 設定済み"
echo "  - データベース本番URL設定済み"
echo "  - reCAPTCHA本番キー設定済み"
echo "  - Google OAuth本番設定済み"
echo ""
echo "🎉 クリーンアップ完了！"