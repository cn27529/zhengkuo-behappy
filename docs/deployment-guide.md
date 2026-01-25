# 部署指南

## 概述

本指南涵蓋 zhengkuo-behappy 系統的完整部署流程，包括開發環境、測試環境和生產環境的配置。

## 系統需求

### 最低硬體需求

- **CPU**: 2 核心
- **記憶體**: 4GB RAM
- **儲存空間**: 10GB 可用空間
- **網路**: 穩定的網際網路連接

### 軟體需求

- **Node.js**: 18.x 或更高版本
- **Rust**: 1.70+ (用於 Rust 後端)
- **Docker**: 20.x+ (可選，用於容器化部署)
- **Git**: 2.x+

---

## 開發環境部署

### 1. 專案克隆與初始化

```bash
# 克隆專案
git clone <repository-url>
cd zhengkuo-behappy

# 安裝根目錄依賴
npm install

# 安裝前端依賴
cd client
npm install
cd ..

# 編譯 Rust 後端
cd rust-axum
cargo build
cd ..
```

### 2. 環境配置

#### 前端環境配置

```bash
# client/.env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_DIRECTUS_URL=http://localhost:8055
VITE_APP_MODE=development
VITE_ENABLE_MOCK=true
```

```bash
# client/.env.production
VITE_API_BASE_URL=https://your-api-domain.com
VITE_DIRECTUS_URL=https://your-directus-domain.com
VITE_APP_MODE=production
VITE_ENABLE_MOCK=false
```

#### Rust 後端環境配置

```bash
# rust-axum/.env
DATABASE_URL=sqlite:../db/data.db
RUST_LOG=debug
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-jwt-secret-key
```

#### Directus 後端環境配置

```bash
# server/.env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
DB_CLIENT=sqlite3
DB_FILENAME=../db/data.db
KEY=your-random-key-here
SECRET=your-random-secret-here
ACCESS_TOKEN_TTL=24h
REFRESH_TOKEN_TTL=30d
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5173
PUBLIC_URL=http://localhost:8055
```

### 3. 資料庫初始化

```bash
# 創建資料庫目錄
mkdir -p db

# 執行資料庫遷移 (Rust 後端)
cd rust-axum
sqlx migrate run --database-url sqlite:../db/data.db

# 或使用提供的 SQL 腳本
sqlite3 ../db/data.db < migrations/sqlite_registrationDB_table.sql
sqlite3 ../db/data.db < migrations/sqlite_activityDB_table.sql
sqlite3 ../db/data.db < migrations/sqlite_monthlyDonateDB_table.sql
```

### 4. 啟動開發服務

#### 方式一：全棧啟動 (推薦)

```bash
# 在根目錄執行，同時啟動所有服務
npm run dev:full
```

#### 方式二：分別啟動

```bash
# 終端 1: 前端開發服務器
cd client
npm run dev

# 終端 2: Rust 後端
cd rust-axum
cargo run

# 終端 3: Directus 後端 (可選)
cd server
npm run dev
```

### 5. 驗證部署

訪問以下 URL 確認服務正常：

- **前端應用**: http://localhost:5173
- **Rust API**: http://localhost:3000/health
- **Directus 管理**: http://localhost:8055

---

## Docker 容器化部署

### 1. Docker Compose 部署

```bash
# 使用 Docker Compose 啟動 Directus
cd docker
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

### 2. 自定義 Docker 映像

#### 前端 Dockerfile

```dockerfile
# client/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Rust 後端 Dockerfile

```dockerfile
# rust-axum/Dockerfile
FROM rust:1.70 as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/rust-axum /usr/local/bin/rust-axum
EXPOSE 3000
CMD ["rust-axum"]
```

### 3. 構建與運行

```bash
# 構建前端映像
cd client
docker build -t zhengkuo-client:latest .

# 構建 Rust 後端映像
cd ../rust-axum
docker build -t zhengkuo-rust:latest .

# 運行容器
docker run -d -p 5173:80 zhengkuo-client:latest
docker run -d -p 3000:3000 zhengkuo-rust:latest
```

---

## 生產環境部署

### 1. 前端部署 (Netlify)

#### 自動部署設定

```bash
# netlify.toml
[build]
  base = "client"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_API_BASE_URL = "https://your-api-domain.com"
  VITE_APP_MODE = "production"
```

#### 手動部署流程

```bash
# 1. 切換到部署分支
git checkout zk-client-netlify

# 2. 重設為目標版本
git reset --hard zk-client-v2-1210

# 3. 推送到遠端 (觸發自動部署)
git push origin zk-client-netlify --force
```

### 2. 後端部署 (VPS/雲端服務器)

#### 系統準備

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝必要軟體
sudo apt install -y nginx sqlite3 certbot python3-certbot-nginx

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

#### 應用部署

```bash
# 創建應用目錄
sudo mkdir -p /opt/zhengkuo-behappy
sudo chown $USER:$USER /opt/zhengkuo-behappy

# 部署應用
cd /opt/zhengkuo-behappy
git clone <repository-url> .

# 安裝依賴並構建
npm install
cd client && npm install && npm run build
cd ../rust-axum && cargo build --release
```

#### Nginx 配置

```nginx
# /etc/nginx/sites-available/zhengkuo-behappy
server {
    listen 80;
    server_name your-domain.com;

    # 前端靜態文件
    location / {
        root /opt/zhengkuo-behappy/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Directus 管理界面 (可選)
    location /admin/ {
        proxy_pass http://localhost:8055/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 啟用站點

```bash
# 啟用站點
sudo ln -s /etc/nginx/sites-available/zhengkuo-behappy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 設定 SSL 憑證
sudo certbot --nginx -d your-domain.com
```

### 3. 系統服務配置

#### Rust 後端服務

```ini
# /etc/systemd/system/zhengkuo-rust.service
[Unit]
Description=Zhengkuo Rust API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/zhengkuo-behappy/rust-axum
ExecStart=/opt/zhengkuo-behappy/rust-axum/target/release/rust-axum
Restart=always
RestartSec=10
Environment=DATABASE_URL=sqlite:../db/data.db
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
```

#### Directus 服務 (可選)

```ini
# /etc/systemd/system/zhengkuo-directus.service
[Unit]
Description=Zhengkuo Directus Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/zhengkuo-behappy/server
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### 啟動服務

```bash
# 重載 systemd 配置
sudo systemctl daemon-reload

# 啟動並啟用服務
sudo systemctl enable zhengkuo-rust
sudo systemctl start zhengkuo-rust

# 檢查服務狀態
sudo systemctl status zhengkuo-rust

# 查看日誌
sudo journalctl -u zhengkuo-rust -f
```

---

## 資料庫管理

### 1. 備份策略

#### 自動備份腳本

```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="/opt/backups/zhengkuo"
DB_PATH="/opt/zhengkuo-behappy/db/data.db"
DATE=$(date +%Y%m%d_%H%M%S)

# 創建備份目錄
mkdir -p $BACKUP_DIR

# 備份資料庫
sqlite3 $DB_PATH ".backup $BACKUP_DIR/data_$DATE.db"

# 壓縮備份
gzip $BACKUP_DIR/data_$DATE.db

# 清理舊備份 (保留 30 天)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Database backup completed: data_$DATE.db.gz"
```

#### 設定定時備份

```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 點備份
0 2 * * * /opt/zhengkuo-behappy/scripts/backup-db.sh
```

### 2. 資料庫遷移

```bash
# 匯出資料
sqlite3 /path/to/old/data.db ".dump" > backup.sql

# 匯入到新資料庫
sqlite3 /path/to/new/data.db < backup.sql

# 驗證資料完整性
sqlite3 /path/to/new/data.db "PRAGMA integrity_check;"
```

---

## 監控與維護

### 1. 日誌管理

#### 日誌輪轉配置

```bash
# /etc/logrotate.d/zhengkuo-behappy
/opt/zhengkuo-behappy/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload zhengkuo-rust
    endscript
}
```

### 2. 效能監控

#### 系統監控腳本

```bash
#!/bin/bash
# scripts/health-check.sh

# 檢查 API 健康狀態
curl -f http://localhost:3000/health || echo "API health check failed"

# 檢查資料庫連接
sqlite3 /opt/zhengkuo-behappy/db/data.db "SELECT 1;" || echo "Database check failed"

# 檢查磁碟空間
df -h | awk '$5 > 80 {print "Disk usage warning: " $0}'

# 檢查記憶體使用
free -m | awk 'NR==2{printf "Memory usage: %.2f%%\n", $3*100/$2}'
```

### 3. 自動更新

#### 更新腳本

```bash
#!/bin/bash
# scripts/deploy-update.sh

cd /opt/zhengkuo-behappy

# 備份當前版本
git stash
git checkout main
git pull origin main

# 更新依賴
npm install
cd client && npm install && npm run build
cd ../rust-axum && cargo build --release

# 重啟服務
sudo systemctl restart zhengkuo-rust
sudo systemctl reload nginx

echo "Deployment completed successfully"
```

---

## 故障排除

### 常見問題

#### 1. 前端無法連接後端

```bash
# 檢查後端服務狀態
sudo systemctl status zhengkuo-rust

# 檢查端口是否開放
netstat -tlnp | grep :3000

# 檢查防火牆設定
sudo ufw status
```

#### 2. 資料庫連接失敗

```bash
# 檢查資料庫文件權限
ls -la /opt/zhengkuo-behappy/db/data.db

# 修正權限
sudo chown www-data:www-data /opt/zhengkuo-behappy/db/data.db
sudo chmod 664 /opt/zhengkuo-behappy/db/data.db
```

#### 3. Nginx 配置錯誤

```bash
# 測試 Nginx 配置
sudo nginx -t

# 查看 Nginx 錯誤日誌
sudo tail -f /var/log/nginx/error.log
```

### 緊急恢復程序

#### 1. 服務恢復

```bash
# 停止所有服務
sudo systemctl stop zhengkuo-rust
sudo systemctl stop nginx

# 恢復資料庫備份
cp /opt/backups/zhengkuo/latest_backup.db /opt/zhengkuo-behappy/db/data.db

# 重啟服務
sudo systemctl start zhengkuo-rust
sudo systemctl start nginx
```

#### 2. 回滾部署

```bash
cd /opt/zhengkuo-behappy

# 回滾到上一個版本
git reset --hard HEAD~1

# 重新構建
cd rust-axum && cargo build --release
sudo systemctl restart zhengkuo-rust
```

---

## 安全性配置

### 1. 防火牆設定

```bash
# 啟用 UFW
sudo ufw enable

# 允許必要端口
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 限制內部端口
sudo ufw deny 3000
sudo ufw deny 8055
```

### 2. SSL/TLS 配置

```bash
# 自動更新 SSL 憑證
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3. 資料庫安全

```bash
# 設定資料庫文件權限
sudo chmod 600 /opt/zhengkuo-behappy/db/data.db
sudo chown www-data:www-data /opt/zhengkuo-behappy/db/data.db
```

---

## 效能優化

### 1. 前端優化

- 啟用 Gzip 壓縮
- 設定適當的快取標頭
- 使用 CDN 加速靜態資源

### 2. 後端優化

- 資料庫連接池配置
- 適當的索引設計
- API 回應快取

### 3. 系統優化

- 調整系統參數
- 監控資源使用情況
- 定期清理日誌文件

---

## 聯繫支援

如遇到部署問題，請：

1. 查看相關日誌文件
2. 執行健康檢查腳本
3. 參考故障排除指南
4. 聯繫開發團隊

**重要文件位置：**

- 應用日誌: `/opt/zhengkuo-behappy/logs/`
- 系統日誌: `/var/log/`
- 配置文件: `/opt/zhengkuo-behappy/`
- 備份文件: `/opt/backups/zhengkuo/`
