# admin user

admin@example.com
1-6

# 建置Dockerfile

在項目根目錄執行
docker build -t zk-server-app .

# 創建meilisearch

```env
MARKETPLACE_TRUST=all
# meilisearch 搜索引擎配置
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=1f42c220-3194-417e-a240-b054acfbfaaf
```

## install meilisearch

```bash
curl -L https://install.meilisearch.com | sh ./meilisearch --master-key="1f42c220-3194-417e-a240-b054acfbfaaf"

```
