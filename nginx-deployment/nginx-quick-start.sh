#!/bin/bash

# 正國寺廟管理系統 - 快速啟動腳本
# 使用方式: ./quick-start.sh [dev|prod|docker]

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印帶顏色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函數：檢查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函數：檢查端口是否被佔用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "端口 $port 已被佔用"
        return 1
    fi
    return 0
}

# 函數：等待服務啟動
wait_for_service() {
    local host=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    print_info "等待服務 $host:$port 啟動..."
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_success "服務 $host:$port 已就緒"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    print_error "服務 $host:$port 啟動超時"
    return 1
}

# 函數：開發環境啟動
start_dev() {
    print_info "啟動開發環境..."
    
    # 檢查 Node.js
    if ! command_exists node; then
        print_error "Node.js 未安裝，請先安裝 Node.js"
        exit 1
    fi
    
    # 檢查 Rust
    if ! command_exists cargo; then
        print_error "Rust 未安裝，請先安裝 Rust"
        exit 1
    fi
    
    # 啟動 Rust 後端
    print_info "啟動 Rust 後端 (Port 3000)..."
    cd rust-axum
    nohup cargo run > /tmp/rust-backend.log 2>&1 &
    echo $! > /tmp/rust-backend.pid
    cd ..
    
    # 啟動日誌服務器
    print_info "啟動日誌服務器 (Port 3002)..."
    cd log-server
    nohup node mongoDBLogger.js > /tmp/log-server.log 2>&1 &
    echo $! > /tmp/log-server.pid
    cd ..
    
    # 啟動文檔服務器
    print_info "啟動文檔服務器 (Port 3001)..."
    cd docs
    nohup node docs-server.js > /tmp/docs-server.log 2>&1 &
    echo $! > /tmp/docs-server.pid
    cd ..
    
    # 等待服務啟動
    sleep 3
    wait_for_service localhost 3000
    wait_for_service localhost 3002
    wait_for_service localhost 3001
    
    # 啟動前端開發服務器
    print_info "啟動前端開發服務器 (Port 5173)..."
    cd client
    npm run dev &
    echo $! > /tmp/frontend-dev.pid
    cd ..
    
    print_success "開發環境啟動完成！"
    echo ""
    echo "服務訪問地址："
    echo "  前端: http://localhost:5173"
    echo "  API: http://localhost:3000"
    echo "  日誌: http://localhost:3002"
    echo "  文檔: http://localhost:3001"
    echo ""
    echo "查看日誌："
    echo "  tail -f /tmp/rust-backend.log"
    echo "  tail -f /tmp/log-server.log"
    echo "  tail -f /tmp/docs-server.log"
}

# 函數：生產環境啟動
start_prod() {
    print_info "啟動生產環境..."
    
    # 檢查 Nginx
    if ! command_exists nginx; then
        print_error "Nginx 未安裝，請先安裝 Nginx"
        exit 1
    fi
    
    # 檢查前端是否已構建
    if [ ! -d "client/dist" ]; then
        print_warning "前端未構建，開始構建..."
        cd client
        npm run build
        cd ..
    fi
    
    # 複製前端文件
    print_info "部署前端文件..."
    sudo mkdir -p /var/www/zhengkuo-behappy
    sudo cp -r client/dist/* /var/www/zhengkuo-behappy/
    
    # 啟動後端服務
    print_info "啟動後端服務..."
    
    if [ -f /etc/systemd/system/zhengkuo-rust.service ]; then
        sudo systemctl start zhengkuo-rust
        sudo systemctl start zhengkuo-logs
        sudo systemctl start zhengkuo-docs
    else
        print_warning "Systemd 服務未配置，使用手動啟動..."
        start_dev
    fi
    
    # 配置 Nginx
    if [ ! -f /etc/nginx/conf.d/zhengkuo-behappy.conf ]; then
        print_info "安裝 Nginx 配置..."
        sudo cp nginx-config.conf /etc/nginx/conf.d/zhengkuo-behappy.conf
        print_warning "請編輯 /etc/nginx/conf.d/zhengkuo-behappy.conf 設置您的域名"
    fi
    
    # 測試並重載 Nginx
    print_info "測試 Nginx 配置..."
    sudo nginx -t
    
    print_info "重載 Nginx..."
    sudo systemctl reload nginx
    
    print_success "生產環境啟動完成！"
    echo ""
    echo "請確保："
    echo "  1. 已配置域名 DNS 記錄"
    echo "  2. 已設置 SSL 證書 (certbot --nginx)"
    echo "  3. 已開放防火牆端口 80, 443"
}

# 函數：Docker 環境啟動
start_docker() {
    print_info "啟動 Docker 環境..."
    
    # 檢查 Docker
    if ! command_exists docker; then
        print_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    # 檢查環境變數文件
    if [ ! -f .env ]; then
        print_warning ".env 文件不存在，從範例複製..."
        cp .env.example .env
        print_warning "請編輯 .env 文件設置您的配置"
        exit 1
    fi
    
    # 構建前端
    if [ ! -d "client/dist" ]; then
        print_info "構建前端..."
        cd client
        npm install
        npm run build
        cd ..
    fi
    
    # 啟動 Docker Compose
    print_info "啟動 Docker 容器..."
    docker-compose up -d
    
    # 等待服務啟動
    sleep 5
    
    # 顯示容器狀態
    print_info "容器狀態："
    docker-compose ps
    
    print_success "Docker 環境啟動完成！"
    echo ""
    echo "訪問地址: http://localhost"
    echo ""
    echo "查看日誌: docker-compose logs -f"
    echo "停止服務: docker-compose down"
}

# 函數：停止所有服務
stop_all() {
    print_info "停止所有服務..."
    
    # 停止進程
    for pid_file in /tmp/rust-backend.pid /tmp/log-server.pid /tmp/docs-server.pid /tmp/frontend-dev.pid; do
        if [ -f $pid_file ]; then
            kill $(cat $pid_file) 2>/dev/null || true
            rm $pid_file
        fi
    done
    
    # 停止 systemd 服務
    if systemctl is-active --quiet zhengkuo-rust; then
        sudo systemctl stop zhengkuo-rust
        sudo systemctl stop zhengkuo-logs
        sudo systemctl stop zhengkuo-docs
    fi
    
    # 停止 Docker
    if [ -f docker-compose.yml ]; then
        docker-compose down 2>/dev/null || true
    fi
    
    print_success "所有服務已停止"
}

# 函數：顯示狀態
show_status() {
    print_info "服務狀態："
    echo ""
    
    # 檢查進程
    echo "進程狀態："
    ps aux | grep -E 'cargo|node|nginx' | grep -v grep || echo "  無運行中的進程"
    echo ""
    
    # 檢查端口
    echo "端口佔用："
    lsof -i :80 -i :443 -i :3000 -i :3001 -i :3002 -i :5173 -i :8055 2>/dev/null || echo "  無佔用的端口"
    echo ""
    
    # 檢查 systemd 服務
    if systemctl list-units --type=service | grep -q zhengkuo; then
        echo "Systemd 服務："
        systemctl status zhengkuo-rust --no-pager 2>/dev/null || true
        systemctl status zhengkuo-logs --no-pager 2>/dev/null || true
        systemctl status zhengkuo-docs --no-pager 2>/dev/null || true
    fi
    
    # 檢查 Docker
    if command_exists docker && [ -f docker-compose.yml ]; then
        echo "Docker 容器："
        docker-compose ps 2>/dev/null || true
    fi
}

# 主程序
main() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║   正國寺廟管理系統 - 快速啟動工具   ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    MODE=${1:-dev}
    
    case $MODE in
        dev)
            start_dev
            ;;
        prod)
            start_prod
            ;;
        docker)
            start_docker
            ;;
        stop)
            stop_all
            ;;
        status)
            show_status
            ;;
        *)
            print_error "未知模式: $MODE"
            echo ""
            echo "使用方式: $0 [dev|prod|docker|stop|status]"
            echo ""
            echo "模式說明："
            echo "  dev    - 開發環境 (前端 + Rust 後端 + 日誌 + 文檔)"
            echo "  prod   - 生產環境 (Nginx + Systemd 服務)"
            echo "  docker - Docker 容器環境"
            echo "  stop   - 停止所有服務"
            echo "  status - 顯示服務狀態"
            exit 1
            ;;
    esac
}

# 執行主程序
main "$@"
