# Rust Axum Backend

## 快速開始

### 1. 安裝依賴

```bash
# 確保已安裝 Rust
cargo --version
```

### 2. 配置環境變數

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 配置
vim .env
```

### 3. 運行項目

```bash
# 開發模式
cargo run

# 生產模式
cargo build --release
./target/release/rust-axum
```

### 4. 測試

```bash
# 運行測試
cargo test

# 健康檢查
curl http://127.0.0.1:3000/health
```

## 項目結構

```
rust-axum/
├── src/
│   ├── main.rs           # 入口文件
│   ├── db.rs             # 數據庫配置
│   ├── handlers/         # API 處理器
│   ├── models/           # 數據模型
│   ├── routes/           # 路由定義
│   └── middleware/       # 中間件
├── migrations/           # 數據庫遷移
├── data/                 # SQLite 數據庫文件
├── Cargo.toml           # 項目配置
└── .env                 # 環境變數（不提交）
```

## 開發指南

### 代碼格式化

```bash
cargo fmt
```

### 代碼檢查

```bash
cargo clippy
```

### 數據庫遷移

```bash
# 創建遷移
sqlx migrate add migration_name

# 運行遷移
sqlx migrate run
```

EOF

git add README.md
git commit -m "docs: 添加項目文檔"

```

## 📋 應該提交到 Git 的文件
```

rust-axum/
├── .gitignore ✅ 提交
├── .env.example ✅ 提交（範例）
├── .env ❌ 不提交（包含敏感信息）
├── README.md ✅ 提交
├── Cargo.toml ✅ 提交
├── Cargo.lock ✅ 提交（應用程式）
├── src/ ✅ 提交（所有源代碼）
├── migrations/ ✅ 提交（數據庫遷移）
├── target/ ❌ 不提交（編譯產物）
├── data/ ❌ 不提交（數據庫文件）
└── .cargo/ ❌ 不提交（緩存）
