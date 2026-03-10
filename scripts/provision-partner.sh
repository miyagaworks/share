#!/bin/bash
# =============================================================
# パートナー環境プロビジョニングスクリプト
# =============================================================
# 使用方法: ./scripts/provision-partner.sh <partner-slug>
# 例:       ./scripts/provision-partner.sh partner-a
#
# 処理内容:
#   1. partners/{slug}/ ディレクトリを作成
#   2. テンプレートからファイルをコピー
#   3. config.json の対話的入力
#   4. 次ステップのコマンド例を出力
# =============================================================

set -euo pipefail

# --- 引数チェック ---
if [ $# -lt 1 ]; then
  echo "使用方法: $0 <partner-slug>"
  echo "例:       $0 partner-a"
  exit 1
fi

PARTNER_SLUG="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="${PROJECT_ROOT}/partners/_template"
PARTNER_DIR="${PROJECT_ROOT}/partners/${PARTNER_SLUG}"

# --- バリデーション ---
if [[ ! "$PARTNER_SLUG" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]]; then
  echo "エラー: partner-slug は小文字英数字とハイフンのみ使用可能です（例: partner-a）"
  exit 1
fi

if [ -d "$PARTNER_DIR" ]; then
  echo "エラー: ${PARTNER_DIR} は既に存在します"
  exit 1
fi

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "エラー: テンプレートディレクトリが見つかりません: ${TEMPLATE_DIR}"
  exit 1
fi

# --- ディレクトリ作成 ---
echo "📁 パートナーディレクトリを作成: ${PARTNER_DIR}"
mkdir -p "$PARTNER_DIR"
cp "${TEMPLATE_DIR}/config.json" "${PARTNER_DIR}/config.json"
cp "${TEMPLATE_DIR}/.env.example" "${PARTNER_DIR}/.env.example"
cp "${TEMPLATE_DIR}/.env.example" "${PARTNER_DIR}/.env"

# --- 対話的入力 ---
echo ""
echo "=== パートナー情報を入力してください ==="
echo ""

read -rp "ブランド名: " BRAND_NAME
read -rp "会社名: " COMPANY_NAME
read -rp "会社URL (https://...): " COMPANY_URL
read -rp "会社住所: " COMPANY_ADDRESS
read -rp "独自ドメイン (例: card.example.com): " DOMAIN
read -rp "サポートメール: " SUPPORT_EMAIL
read -rp "プライマリカラー (HEX, 例: #1B2A4A): " PRIMARY_COLOR
read -rp "タグライン: " TAGLINE

# --- config.json 更新 ---
# macOS / Linux 互換の sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_CMD="sed -i ''"
else
  SED_CMD="sed -i"
fi

# jq が使えればjqを使用、なければsedで置換
if command -v jq &> /dev/null; then
  jq \
    --arg slug "$PARTNER_SLUG" \
    --arg name "$BRAND_NAME" \
    --arg company "$COMPANY_NAME" \
    --arg url "$COMPANY_URL" \
    --arg address "$COMPANY_ADDRESS" \
    --arg domain "$DOMAIN" \
    --arg email "$SUPPORT_EMAIL" \
    --arg color "$PRIMARY_COLOR" \
    --arg tagline "$TAGLINE" \
    '.slug = $slug | .name = $name | .companyName = $company | .companyUrl = $url | .companyAddress = $address | .domain = $domain | .supportEmail = $email | .primaryColor = $color | .tagline = $tagline | .createdAt = (now | strftime("%Y-%m-%d"))' \
    "${PARTNER_DIR}/config.json" > "${PARTNER_DIR}/config.json.tmp" && \
    mv "${PARTNER_DIR}/config.json.tmp" "${PARTNER_DIR}/config.json"
  echo "✅ config.json を更新しました"
else
  echo "⚠️  jq が見つかりません。config.json を手動で編集してください。"
fi

# --- .env 更新 ---
if [[ -n "$BRAND_NAME" ]]; then
  $SED_CMD "s|BRAND_NAME=.*|BRAND_NAME=${BRAND_NAME}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXT_PUBLIC_BRAND_NAME=.*|NEXT_PUBLIC_BRAND_NAME=${BRAND_NAME}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|FROM_NAME=.*|FROM_NAME=${BRAND_NAME}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|BRAND_COMPANY_NAME=.*|BRAND_COMPANY_NAME=${COMPANY_NAME}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXT_PUBLIC_BRAND_COMPANY_NAME=.*|NEXT_PUBLIC_BRAND_COMPANY_NAME=${COMPANY_NAME}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|BRAND_COMPANY_URL=.*|BRAND_COMPANY_URL=${COMPANY_URL}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXT_PUBLIC_BRAND_COMPANY_URL=.*|NEXT_PUBLIC_BRAND_COMPANY_URL=${COMPANY_URL}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|BRAND_COMPANY_ADDRESS=.*|BRAND_COMPANY_ADDRESS=${COMPANY_ADDRESS}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXT_PUBLIC_BRAND_COMPANY_ADDRESS=.*|NEXT_PUBLIC_BRAND_COMPANY_ADDRESS=${COMPANY_ADDRESS}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|BRAND_SUPPORT_EMAIL=.*|BRAND_SUPPORT_EMAIL=${SUPPORT_EMAIL}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXT_PUBLIC_BRAND_SUPPORT_EMAIL=.*|NEXT_PUBLIC_BRAND_SUPPORT_EMAIL=${SUPPORT_EMAIL}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|BRAND_PRIMARY_COLOR=.*|BRAND_PRIMARY_COLOR=${PRIMARY_COLOR}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|BRAND_TAGLINE=.*|BRAND_TAGLINE=${TAGLINE}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXT_PUBLIC_BRAND_TAGLINE=.*|NEXT_PUBLIC_BRAND_TAGLINE=${TAGLINE}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://${DOMAIN}|g" "${PARTNER_DIR}/.env"
  $SED_CMD "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://${DOMAIN}|g" "${PARTNER_DIR}/.env"
  echo "✅ .env を更新しました"
fi

echo ""
echo "============================================"
echo "✅ パートナーディレクトリを作成しました: ${PARTNER_DIR}"
echo "============================================"
echo ""
echo "--- 次のステップ ---"
echo ""
echo "1. .env の機密情報を設定:"
echo "   vi ${PARTNER_DIR}/.env"
echo "   # DATABASE_URL, DIRECT_URL, RESEND_API_KEY, GOOGLE_CLIENT_ID 等を設定"
echo ""
echo "2. Supabase プロジェクト作成:"
echo "   # https://supabase.com/dashboard で 'share-${PARTNER_SLUG}' を作成"
echo "   # リージョン: ap-northeast-1, プラン: Pro"
echo ""
echo "3. Prisma マイグレーション実行:"
echo "   source ${PARTNER_DIR}/.env && npx prisma migrate deploy"
echo ""
echo "4. Vercel プロジェクト作成:"
echo "   # vercel project add share-${PARTNER_SLUG}"
echo "   # 環境変数を Vercel ダッシュボードで設定"
echo ""
echo "5. カスタムドメイン追加:"
echo "   # vercel domains add ${DOMAIN}"
echo "   # パートナーに CNAME 設定を依頼: ${DOMAIN} → cname.vercel-dns.com"
echo ""
echo "6. Resend ドメイン追加:"
echo "   # https://resend.com/domains でドメインを追加・DNS検証"
echo ""
echo "7. 動作確認:"
echo "   # docs/partner-checklist.md の全項目をチェック"
echo ""
