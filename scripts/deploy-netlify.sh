#!/bin/bash

echo "🚀 開始部署到 Netlify..."

# 1. 切換到部署分支
git checkout zk-client-netlify

# 2. 重設為開發分支內容
git reset --hard zk-client-rustaxum

# 3. 提交變更
git add .
git commit -m "Deploy: Production build with publish filter"

# 4. 推送到遠端
git push origin zk-client-netlify --force

echo "✅ 部署完成！"
echo "📝 Netlify 會自動設置 NODE_ENV=production 來觸發 publish 過濾"

# 5. 切回版本以免誤改到代碼
git checkout zk-client-rustaxum
