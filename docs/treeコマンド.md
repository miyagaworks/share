tree -I 'node_modules|.git|.next|dist|build'
tree -I 'node_modules|.git|.next|dist|build|backup_*'



# 全ての変更ファイルをステージング領域に追加
git add .

# 変更内容をコミット
git commit -m "認証関連を修正"

# リモートリポジトリにプッシュ
git push origin main


# バックアップディレクトリを作成
mkdir -p backup_$(date +%Y%m%d)

# rsyncで重たいファイルを除外してコピー
rsync -av --progress ./ backup_$(date +%Y%m%d)/ \
  --exclude="node_modules" \
  --exclude="package-lock.json" \
  --exclude="pnpm-lock.yaml" \
  --exclude=".next" \
  --exclude=".git"