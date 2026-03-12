# 鎮國寺廟管理系統 - Nginx 部署套件

這個套件包含了將鎮國寺廟管理系統部署到生產環境所需的所有配置文件和腳本。

## 📁 文件說明

| 文件                   | 說明                  |
| ---------------------- | --------------------- |
| `nginx-config.conf`    | Nginx 主配置文件      |
| `nginx-setup-guide.md` | 完整的設置指南 (必讀) |
| `docker-compose.yml`   | Docker 容器編排配置   |
| `.env.example`         | 環境變數範例          |
| `quick-start.sh`       | 快速啟動腳本          |
| `README.md`            | 本文件                |

## 🚀 快速開始

### 方案一：傳統部署 (推薦生產環境)

```bash
# 1. 複製配置文件
sudo cp nginx-config.conf /etc/nginx/conf.d/zhengkuo-behappy.conf

# 2. 編輯域名設置
sudo nano /etc/nginx/conf.d/zhengkuo-behappy.conf
# 將 your-domain.com 替換為實際域名

# 3. 使用快速啟動腳本
./quick-start.sh prod
```

### 方案二：Docker 部署 (推薦開發/測試)

```bash
# 1. 複製環境變數
cp .env.example .env

# 2. 編輯配置
nano .env

# 3. 啟動容器
./quick-start.sh docker
```

### 方案三：開發環境

```bash
# 直接啟動開發環境
./quick-start.sh dev
```

## 📖 詳細文檔

請參閱 `nginx-setup-guide.md` 獲取：

- 完整的安裝步驟
- SSL 證書配置
- 服務管理
- 故障排除
- 性能優化建議

## ✅ 部署前檢查清單

- [ ] 已安裝 Nginx 1.18+
- [ ] 已安裝 Node.js 16+
- [ ] 已安裝 Rust 1.70+
- [ ] DNS 記錄已配置
- [ ] 防火牆端口已開放 (80, 443)
- [ ] SSL 證書已準備 (Let's Encrypt 或其他)
- [ ] 環境變數已配置
- [ ] 資料庫文件已準備

## 🛠️ 快速命令

```bash
# 啟動開發環境
./quick-start.sh dev

# 啟動生產環境
./quick-start.sh prod

# 啟動 Docker 環境
./quick-start.sh docker

# 停止所有服務
./quick-start.sh stop

# 查看服務狀態
./quick-start.sh status

# 測試 Nginx 配置
sudo nginx -t

# 重載 Nginx
sudo systemctl reload nginx

# 查看日誌
sudo tail -f /var/log/nginx/zhengkuo-error.log
```

## 🏗️ 系統架構

```
                    ┌─────────────┐
                    │   Internet  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │ :80, :443
                    │  (反向代理)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
   │ Frontend│      │   Rust    │     │   Logs    │
   │  :5173  │      │  Backend  │     │  Server   │
   │         │      │   :3000   │     │   :3002   │
   └─────────┘      └───────────┘     └───────────┘
                           │
                    ┌──────▼──────┐
                    │   SQLite    │
                    │  Database   │
                    └─────────────┘
```

## 📊 服務端口映射

| 服務     | 內部端口 | 外部訪問   |
| -------- | -------- | ---------- |
| 前端     | 5173     | /          |
| Rust API | 3000     | /api/      |
| Directus | 8055     | /directus/ |
| 日誌服務 | 3002     | /logs/     |
| 文檔服務 | 3001     | /docs/     |

## 🔒 安全建議

1. **使用 HTTPS**
   - 配置 Let's Encrypt SSL 證書
   - 啟用 HSTS

2. **防火牆設置**
   - 僅開放必要端口 (80, 443)
   - 限制直接訪問後端端口

3. **定期更新**
   - 保持系統套件最新
   - 更新 SSL 證書

4. **備份策略**
   - 每日自動備份資料庫
   - 保留 30 天備份

## 🐛 故障排除

### Nginx 無法啟動

```bash
sudo nginx -t
sudo journalctl -u nginx -n 50
```

### 502 Bad Gateway

```bash
# 檢查後端服務
./quick-start.sh status

# 重啟後端
./quick-start.sh stop
./quick-start.sh prod
```

### SSL 證書問題

```bash
sudo certbot renew
sudo certbot certificates
```

## 📞 支援

如需幫助，請：

1. 查閱 `nginx-setup-guide.md`
2. 檢查系統日誌
3. 聯繫技術支援

## 📝 更新日誌

- **2024-02** - 初始版本
  - Nginx 反向代理配置
  - Docker 支援
  - 快速啟動腳本
  - 完整設置指南

---

**License:** MIT  
**Author:** Zhengkuo Temple Management Team
