# Nginx 設置指南 - 鎮國寺廟管理系統

## 📋 目錄

1. [系統需求](#系統需求)
2. [安裝 Nginx](#安裝-nginx)
3. [配置 Nginx](#配置-nginx)
4. [SSL 證書設置](#ssl-證書設置)
5. [服務啟動](#服務啟動)
6. [測試與驗證](#測試與驗證)
7. [常見問題](#常見問題)
8. [生產環境部署](#生產環境部署)

---

## 系統需求

### 硬體需求

- CPU: 2核心以上
- RAM: 4GB 以上
- 硬碟: 20GB 以上可用空間

### 軟體需求

- Ubuntu 20.04 / 22.04 或 CentOS 7 / 8
- Nginx 1.18+
- Node.js 16+
- Rust 1.70+
- SQLite 3
- MongoDB (日誌服務器用)

### 端口需求

確保以下端口可用：

- 80 (HTTP)
- 443 (HTTPS)
- 3000 (Rust Backend)
- 3001 (Docs Server)
- 3002 (Log Server)
- 5173 (Frontend Dev)
- 8055 (Directus)

---

## 安裝 Nginx

### Ubuntu / Debian

```bash
# 更新套件列表
sudo apt update

# 安裝 Nginx
sudo apt install nginx -y

# 啟動 Nginx
sudo systemctl start nginx

# 設置開機自動啟動
sudo systemctl enable nginx

# 檢查狀態
sudo systemctl status nginx
```

### CentOS / RHEL

```bash
# 安裝 Nginx
sudo yum install nginx -y

# 啟動服務
sudo systemctl start nginx
sudo systemctl enable nginx

# 開放防火牆
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### macOS (開發用)

```bash
# 使用 Homebrew 安裝
brew install nginx

# 啟動服務
brew services start nginx
```

---

## 配置 Nginx

### 1. 複製配置文件

```bash
# 備份原始配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 複製專案配置
sudo cp nginx-config.conf /etc/nginx/conf.d/zhengkuo-behappy.conf
```

### 2. 修改域名設置

編輯配置文件：

```bash
sudo nano /etc/nginx/conf.d/zhengkuo-behappy.conf
```

修改以下內容：

```nginx
# 將 your-domain.com 替換為您的實際域名
server_name your-domain.com www.your-domain.com;

# 開發環境域名
server_name dev.your-domain.com;
```

### 3. 生產環境配置 (使用構建後的靜態文件)

如果前端已構建為靜態文件，使用以下配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 配置...

    # 前端靜態文件
    location / {
        root /var/www/zhengkuo-behappy/dist;
        try_files $uri $uri/ /index.html;

        # 緩存靜態資源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        # ... 其他代理設置
    }
}
```

### 4. 檢查配置語法

```bash
# 測試配置文件
sudo nginx -t

# 應該看到：
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## SSL 證書設置

### 使用 Let's Encrypt (推薦 - 免費)

#### 1. 安裝 Certbot

**Ubuntu / Debian:**

```bash
sudo apt install certbot python3-certbot-nginx -y
```

**CentOS / RHEL:**

```bash
sudo yum install certbot python3-certbot-nginx -y
```

#### 2. 獲取證書

```bash
# 自動配置 Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 或手動獲取證書
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

#### 3. 自動續期

```bash
# 測試自動續期
sudo certbot renew --dry-run

# 設置自動續期 (cron job)
sudo crontab -e

# 添加以下行（每天凌晨2點檢查）
0 2 * * * /usr/bin/certbot renew --quiet
```

### 使用自簽證書 (僅開發環境)

```bash
# 創建證書目錄
sudo mkdir -p /etc/nginx/ssl

# 生成自簽證書
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt

# 修改配置文件中的證書路徑
ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;
```

---

## 服務啟動

### 1. 啟動所有後端服務

創建啟動腳本：

```bash
cat > ~/start-services.sh << 'EOF'
#!/bin/bash

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}正在啟動鎮國寺廟管理系統...${NC}"

# 啟動 Rust 後端
echo -e "${YELLOW}啟動 Rust 後端 (Port 3000)...${NC}"
cd ~/zhengkuo-behappy/rust-axum
nohup cargo run --release > /tmp/rust-backend.log 2>&1 &
echo $! > /tmp/rust-backend.pid

# 啟動日誌服務器
echo -e "${YELLOW}啟動日誌服務器 (Port 3002)...${NC}"
cd ~/zhengkuo-behappy/log-server
nohup node mongoDBLogger.js > /tmp/log-server.log 2>&1 &
echo $! > /tmp/log-server.pid

# 啟動文檔服務器
echo -e "${YELLOW}啟動文檔服務器 (Port 3001)...${NC}"
cd ~/zhengkuo-behappy/docs
nohup node docs-server.js > /tmp/docs-server.log 2>&1 &
echo $! > /tmp/docs-server.pid

# 啟動 Directus (可選)
echo -e "${YELLOW}啟動 Directus (Port 8055)...${NC}"
cd ~/zhengkuo-behappy/server
nohup npx directus start > /tmp/directus.log 2>&1 &
echo $! > /tmp/directus.pid

# 等待服務啟動
sleep 5

echo -e "${GREEN}所有服務已啟動！${NC}"
echo -e "${YELLOW}檢查服務狀態：${NC}"
ps aux | grep -E 'cargo|node|directus' | grep -v grep
EOF

chmod +x ~/start-services.sh
```

執行啟動腳本：

```bash
~/start-services.sh
```

### 2. 創建停止服務腳本

```bash
cat > ~/stop-services.sh << 'EOF'
#!/bin/bash

echo "停止所有服務..."

# 停止 Rust 後端
if [ -f /tmp/rust-backend.pid ]; then
    kill $(cat /tmp/rust-backend.pid)
    rm /tmp/rust-backend.pid
fi

# 停止日誌服務器
if [ -f /tmp/log-server.pid ]; then
    kill $(cat /tmp/log-server.pid)
    rm /tmp/log-server.pid
fi

# 停止文檔服務器
if [ -f /tmp/docs-server.pid ]; then
    kill $(cat /tmp/docs-server.pid)
    rm /tmp/docs-server.pid
fi

# 停止 Directus
if [ -f /tmp/directus.pid ]; then
    kill $(cat /tmp/directus.pid)
    rm /tmp/directus.pid
fi

echo "所有服務已停止"
EOF

chmod +x ~/stop-services.sh
```

### 3. 使用 systemd 管理服務 (推薦)

創建服務文件：

```bash
# Rust Backend Service
sudo tee /etc/systemd/system/zhengkuo-rust.service > /dev/null << EOF
[Unit]
Description=Zhengkuo Rust Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/zhengkuo-behappy/rust-axum
ExecStart=/home/$USER/.cargo/bin/cargo run --release
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Log Server Service
sudo tee /etc/systemd/system/zhengkuo-logs.service > /dev/null << EOF
[Unit]
Description=Zhengkuo Log Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/zhengkuo-behappy/log-server
ExecStart=/usr/bin/node mongoDBLogger.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Docs Server Service
sudo tee /etc/systemd/system/zhengkuo-docs.service > /dev/null << EOF
[Unit]
Description=Zhengkuo Docs Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/zhengkuo-behappy/docs
ExecStart=/usr/bin/node docs-server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 重載 systemd
sudo systemctl daemon-reload

# 啟動服務
sudo systemctl start zhengkuo-rust
sudo systemctl start zhengkuo-logs
sudo systemctl start zhengkuo-docs

# 設置開機啟動
sudo systemctl enable zhengkuo-rust
sudo systemctl enable zhengkuo-logs
sudo systemctl enable zhengkuo-docs

# 檢查狀態
sudo systemctl status zhengkuo-rust
sudo systemctl status zhengkuo-logs
sudo systemctl status zhengkuo-docs
```

### 4. 重新加載 Nginx

```bash
# 測試配置
sudo nginx -t

# 重新加載配置
sudo systemctl reload nginx

# 或重啟 Nginx
sudo systemctl restart nginx
```

---

## 測試與驗證

### 1. 檢查服務端口

```bash
# 檢查所有服務是否在監聽
sudo netstat -tlnp | grep -E '80|443|3000|3001|3002|5173|8055'

# 或使用 ss
sudo ss -tlnp | grep -E '80|443|3000|3001|3002|5173|8055'
```

預期輸出：

```
tcp  LISTEN  0  511  *:80      *:*     users:(("nginx",pid=...))
tcp  LISTEN  0  511  *:443     *:*     users:(("nginx",pid=...))
tcp  LISTEN  0  128  *:3000    *:*     users:(("cargo",pid=...))
tcp  LISTEN  0  128  *:3001    *:*     users:(("node",pid=...))
tcp  LISTEN  0  128  *:3002    *:*     users:(("node",pid=...))
```

### 2. 測試各個端點

```bash
# 測試前端
curl -I http://localhost

# 測試 API
curl http://localhost/api/health

# 測試日誌服務
curl http://localhost/logs/health

# 測試文檔服務
curl http://localhost/docs/

# HTTPS 測試 (如果已配置 SSL)
curl -I https://your-domain.com
```

### 3. 查看日誌

```bash
# Nginx 錯誤日誌
sudo tail -f /var/log/nginx/zhengkuo-error.log

# Nginx 訪問日誌
sudo tail -f /var/log/nginx/zhengkuo-access.log

# 服務日誌
tail -f /tmp/rust-backend.log
tail -f /tmp/log-server.log
tail -f /tmp/docs-server.log
```

### 4. 功能測試清單

- [ ] 前端頁面可以訪問
- [ ] 登記功能正常
- [ ] 每月贊助功能正常
- [ ] 活動管理功能正常
- [ ] API 響應正常
- [ ] 日誌記錄正常
- [ ] 文檔可以瀏覽
- [ ] SSL 證書有效
- [ ] HTTPS 重定向正常
- [ ] 靜態資源緩存生效

---

## 常見問題

### Q1: Nginx 無法啟動

```bash
# 檢查配置錯誤
sudo nginx -t

# 檢查端口占用
sudo lsof -i :80
sudo lsof -i :443

# 查看詳細錯誤
sudo journalctl -u nginx -n 50
```

### Q2: 502 Bad Gateway

原因：後端服務未啟動或無法連接

解決：

```bash
# 檢查後端服務
ps aux | grep -E 'cargo|node'

# 重啟後端服務
~/start-services.sh

# 檢查防火牆
sudo ufw status
```

### Q3: SSL 證書錯誤

```bash
# 更新證書
sudo certbot renew

# 檢查證書有效期
sudo certbot certificates

# 強制更新
sudo certbot renew --force-renewal
```

### Q4: 靜態文件 404

檢查文件路徑和權限：

```bash
# 檢查文件是否存在
ls -la /var/www/zhengkuo-behappy/dist

# 設置正確權限
sudo chown -R www-data:www-data /var/www/zhengkuo-behappy
sudo chmod -R 755 /var/www/zhengkuo-behappy
```

### Q5: CORS 錯誤

在 Nginx 配置中添加 CORS 標頭：

```nginx
add_header Access-Control-Allow-Origin * always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
```

---

## 生產環境部署

### 完整部署步驟

#### 1. 準備環境

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝必要工具
sudo apt install -y git curl build-essential

# 克隆專案
git clone https://github.com/your-repo/zhengkuo-behappy.git
cd zhengkuo-behappy
```

#### 2. 構建前端

```bash
cd client
npm install
npm run build

# 複製構建文件到 Web 根目錄
sudo mkdir -p /var/www/zhengkuo-behappy
sudo cp -r dist/* /var/www/zhengkuo-behappy/
```

#### 3. 編譯 Rust 後端

```bash
cd ../rust-axum
cargo build --release

# 複製執行文件
sudo cp target/release/your-binary-name /usr/local/bin/zhengkuo-rust
```

#### 4. 配置環境變數

```bash
# 創建環境文件
sudo tee /etc/zhengkuo/.env > /dev/null << EOF
DATABASE_URL=/var/lib/zhengkuo/current.db
LOG_LEVEL=info
RUST_BACKTRACE=1
EOF

# 設置權限
sudo chmod 600 /etc/zhengkuo/.env
```

#### 5. 設置 systemd 服務

參考前面的 systemd 配置章節

#### 6. 配置防火牆

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 7. 設置 SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 8. 最終檢查

```bash
# 測試所有服務
curl https://your-domain.com
curl https://your-domain.com/api/health
curl https://your-domain.com/logs/health
curl https://your-domain.com/docs/

# 查看系統狀態
sudo systemctl status nginx
sudo systemctl status zhengkuo-rust
sudo systemctl status zhengkuo-logs
```

### 監控與維護

#### 設置日誌輪轉

```bash
sudo tee /etc/logrotate.d/zhengkuo > /dev/null << EOF
/var/log/nginx/zhengkuo-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null
    endscript
}
EOF
```

#### 設置備份

```bash
# 創建備份腳本
cat > ~/backup-zhengkuo.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/zhengkuo"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 備份資料庫
cp /var/lib/zhengkuo/current.db $BACKUP_DIR/db_$DATE.db

# 備份配置
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx/conf.d/zhengkuo-behappy.conf

# 刪除 30 天前的備份
find $BACKUP_DIR -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup-zhengkuo.sh

# 設置每日自動備份
(crontab -l 2>/dev/null; echo "0 3 * * * ~/backup-zhengkuo.sh") | crontab -
```

---

## 效能優化建議

### Nginx 優化

```nginx
# 在 http 區塊添加
worker_processes auto;
worker_connections 2048;

# 啟用 HTTP/2
listen 443 ssl http2;

# 啟用快取
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache app_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating;
}
```

### 系統優化

```bash
# 增加文件描述符限制
sudo tee -a /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
EOF

# 優化 TCP 設置
sudo tee -a /etc/sysctl.conf << EOF
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 8192
EOF

sudo sysctl -p
```

---

## 總結

按照本指南，您應該能夠成功設置並運行鎮國寺廟管理系統。記得：

1. ✅ 定期更新系統和套件
2. ✅ 監控服務狀態和日誌
3. ✅ 定期備份數據
4. ✅ 保持 SSL 證書有效
5. ✅ 測試備份恢復流程

如有問題，請查看日誌文件或聯繫技術支援。
