#!/bin/bash
# =============================================================
# 全パートナー環境マイグレーションスクリプト
# =============================================================
# 使用方法: ./scripts/migrate-all.sh
#
# partners/ 配下の全パートナーディレクトリを検索し、
# 各パートナーの .env から DATABASE_URL / DIRECT_URL を読み取って
# prisma migrate deploy を実行する。
#
# 注意:
#   - _template ディレクトリはスキップされる
#   - .env ファイルが存在しないパートナーはスキップされる
#   - 1つでも失敗した場合、exit code 1 で終了する
# =============================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PARTNERS_DIR="${PROJECT_ROOT}/partners"

# --- パートナーディレクトリの存在確認 ---
if [ ! -d "$PARTNERS_DIR" ]; then
  echo "エラー: partners/ ディレクトリが見つかりません"
  exit 1
fi

# --- 結果カウンター ---
SUCCESS=()
FAILED=()
SKIPPED=()

echo "============================================"
echo "全パートナー環境マイグレーション"
echo "============================================"
echo ""

# --- 各パートナーに対してマイグレーション実行 ---
for partner_dir in "${PARTNERS_DIR}"/*/; do
  # ディレクトリでない場合スキップ
  [ ! -d "$partner_dir" ] && continue

  partner_slug="$(basename "$partner_dir")"

  # テンプレートはスキップ
  if [ "$partner_slug" = "_template" ]; then
    continue
  fi

  env_file="${partner_dir}.env"

  # .env ファイルがない場合スキップ
  if [ ! -f "$env_file" ]; then
    echo "⏭️  ${partner_slug}: .env が見つかりません（スキップ）"
    SKIPPED+=("$partner_slug")
    continue
  fi

  echo "🔄 ${partner_slug}: マイグレーション実行中..."

  # .env から DATABASE_URL と DIRECT_URL を読み取り
  # （exportされていない変数も読み取れるように grep + cut で抽出）
  db_url=$(grep -E '^DATABASE_URL=' "$env_file" | head -1 | cut -d'=' -f2-)
  direct_url=$(grep -E '^DIRECT_URL=' "$env_file" | head -1 | cut -d'=' -f2-)

  if [ -z "$db_url" ] || [ -z "$direct_url" ]; then
    echo "❌ ${partner_slug}: DATABASE_URL または DIRECT_URL が未設定"
    FAILED+=("$partner_slug")
    continue
  fi

  # マイグレーション実行
  if DATABASE_URL="$db_url" DIRECT_URL="$direct_url" \
     npx prisma migrate deploy --schema="${PROJECT_ROOT}/prisma/schema.prisma" 2>&1; then
    echo "✅ ${partner_slug}: マイグレーション完了"
    SUCCESS+=("$partner_slug")
  else
    echo "❌ ${partner_slug}: マイグレーション失敗"
    FAILED+=("$partner_slug")
  fi

  echo ""
done

# --- サマリ表示 ---
echo "============================================"
echo "マイグレーション結果サマリ"
echo "============================================"
echo ""

if [ ${#SUCCESS[@]} -gt 0 ]; then
  echo "✅ 成功 (${#SUCCESS[@]}): ${SUCCESS[*]}"
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo "⏭️  スキップ (${#SKIPPED[@]}): ${SKIPPED[*]}"
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "❌ 失敗 (${#FAILED[@]}): ${FAILED[*]}"
  echo ""
  echo "失敗したパートナーの .env を確認し、手動で再実行してください:"
  for f in "${FAILED[@]}"; do
    echo "  source partners/${f}/.env && npx prisma migrate deploy"
  done
  exit 1
fi

echo ""
echo "全パートナーのマイグレーションが完了しました。"
