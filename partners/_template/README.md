# パートナー環境テンプレート

このディレクトリは買取型パートナーの環境設定テンプレートです。

## 新規パートナーのセットアップ

```bash
# プロビジョニングスクリプトを使用（推奨）
./scripts/provision-partner.sh <partner-slug>

# 手動の場合
cp -r partners/_template partners/<partner-slug>
# partners/<partner-slug>/config.json を編集
# partners/<partner-slug>/.env.example を .env にリネームして編集
```

## ファイル構成

| ファイル | 内容 | 機密 |
|---------|------|------|
| `config.json` | ブランド設定（非機密） | No |
| `.env.example` | 環境変数テンプレート | No |
| `.env` | 実際の環境変数（作成後） | **Yes** |

## 詳細手順

`docs/provisioning-guide.md` を参照してください。
