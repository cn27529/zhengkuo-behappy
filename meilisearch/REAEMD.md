# 改用直接下載二進制檔：

```bash
# 直接從 Meilisearch 官方下載預編譯版本
curl -L https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch-macos-amd64 -o meilisearch

chmod +x meilisearch
./meilisearch --version
```

# 確認版本後移到 PATH：

```bash
sudo mv meilisearch /usr/local/bin/
```

# 啟動 meilisearch

```bash
meilisearch --master-key="1f42c220-3194-417e-a240-b054acfbfaaf"
```

# env 搜索引擎配置

```env

MARKETPLACE_TRUST=all
# meilisearch 搜索引擎配置
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=1f42c220-3194-417e-a240-b054acfbfaaf

```
