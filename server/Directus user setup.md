# Directus 用戶設置指南

## 1. 訪問 Directus Admin

啟動 Directus 後，訪問：
```
http://localhost:8055/admin
```

使用初始化時設置的管理員帳號登入。

## 2. 創建角色（Roles）

進入 **Settings → Roles & Permissions**

創建以下角色：

### 角色列表
- **Admin** - 管理員（已存在）
- **Temple Staff** - 寺廟職員
- **Volunteer** - 志工
- **User** - 一般用戶

### 設定權限
為每個角色設定適當的權限：
- 讀取（Read）
- 創建（Create）
- 更新（Update）
- 刪除（Delete）

## 3. 創建用戶（Users）

進入 **User Directory**，創建以下測試用戶：

| Email | 密碼 | 角色 | 姓名 |
|-------|------|------|------|
| admin@temple.com | password!123456 | Admin | 系統管理員 |
| zkuser01@temple.com | zk!123456 | Temple Staff | 職員01 |
| temple.staff@temple.com | temple123 | Temple Staff | 寺廟職員 |
| volunteer@temple.com | volunteer123 | Volunteer | 志工 |
| user01@temple.com | user0123 | User | 用戶01 |

## 4. 設置 CORS

在 `server/.env` 確認 CORS 設定：

```env
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5173
# 多個來源用逗號分隔
# CORS_ORIGIN=http://localhost:5173,http://localhost:8055
```

## 5. 自定義用戶欄位（可選）

如果需要額外的用戶資料：

1. 進入 **Settings → Data Model → Users**
2. 添加自定義欄位：
   - `display_name` (String) - 顯示名稱
   - `department` (String) - 部門
   - `phone` (String) - 電話
   - `status` (String) - 狀態

## 6. API 端點

Directus 提供以下認證端點：

- **登入**: `POST /auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```

- **登出**: `POST /auth/logout`
  ```json
  {
    "refresh_token": "your-refresh-token"
  }
  ```

- **刷新 Token**: `POST /auth/refresh`
  ```json
  {
    "refresh_token": "your-refresh-token",
    "mode": "json"
  }
  ```

- **獲取當前用戶**: `GET /users/me`
  需要在 Header 中帶上：
  ```
  Authorization: Bearer your-access-token
  ```

## 7. 測試連接

在瀏覽器控制台執行：

```javascript
// 測試健康檢查
fetch('http://localhost:8055/server/health')
  .then(r => r.json())
  .then(console.log);

// 測試登入
fetch('http://localhost:8055/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@temple.com',
    password: 'password!123456'
  })
})
  .then(r => r.json())
  .then(console.log);
```

## 8. 啟動順序

1. 啟動 Directus:
   ```bash
   cd server
   npm run dev
   ```

2. 啟動 Vue 應用:
   ```bash
   npm run dev
   ```

3. 在 Vue 應用中切換模式：
   - 開發時使用 `mock` 模式
   - 測試 Directus 時使用 `directus` 模式
   - 通過 `.env.local` 配置切換

## 9. 故障排除

### Directus 無法啟動
- 檢查端口 5173 是否被占用
- 確認資料庫連接正常
- 查看 `server/logs` 目錄的錯誤日誌

### CORS 錯誤
- 確認 `.env` 中的 `CORS_ORIGIN` 設定正確
- 檢查前端請求的 URL 是否正確

### 401 錯誤
- Token 可能已過期，檢查 refresh token 機制
- 確認用戶角色有適當權限

### 連接失敗
- 確認 Directus 服務正在運行
- 檢查 `VITE_API_BASE_URL` 設定
- 使用瀏覽器 Network 面板查看請求詳情