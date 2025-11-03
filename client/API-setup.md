# API 配置與使用指南

## 📁 重構後的檔案結構

```
src/
├── config/
│   └── axiosConfig.js          # 🎯 所有 API URL 配置集中在這裡
├── services/
│   ├── axiosService.js         # HTTP 請求封裝
│   └── authService.js          # 認證服務
└── data/
    └── auth_user.json          # Mock 用戶資料
```

## 🎯 核心改進

### 1. 配置集中化
所有後端 URL 現在都在 `axiosConfig.js` 中管理：

```javascript
// ✅ 好處：修改 URL 只需要在一個地方
import { apiEndpoints } from '@/config/axiosConfig';

// 使用端點
apiEndpoints.auth.login          // "/auth/login"
apiEndpoints.users.detail(123)   // "/users/123"
apiEndpoints.collections.items('temples')  // "/items/temples"
```

### 2. 清晰的命名
- `auth.js` → `axiosConfig.js` ✅ 更直覺
- 包含所有 API 配置，不僅限於認證

## 📝 使用範例

### 認證功能

```javascript
import { authService } from '@/services/authService';

// 登入
const result = await authService.login('admin@temple.com', 'password!123456');
if (result.success) {
  console.log('登入成功', result.data.user);
}

// 登出
await authService.logout();

// 驗證 token
const validation = await authService.validateToken();

// 獲取當前用戶
const user = authService.getCurrentUser();

// 檢查角色
if (authService.hasRole('admin')) {
  console.log('用戶是管理員');
}
```

### 使用 AxiosService 直接請求

```javascript
import { axiosService } from '@/services/axiosService';
import { apiEndpoints } from '@/config/axiosConfig';

// GET 請求
const response = await axiosService.get(apiEndpoints.users.list);

// POST 請求
const newUser = await axiosService.post(apiEndpoints.users.create, {
  email: 'new@user.com',
  password: 'password',
  role: 'user',
});

// Directus 集合操作
const temples = await axiosService.getItems('temples', {
  limit: 10,
  sort: '-created_at',
});

const temple = await axiosService.getItem('temples', 1);

await axiosService.createItem('temples', {
  name: '新寺廟',
  address: '台灣彰化',
});

await axiosService.updateItem('temples', 1, {
  status: 'active',
});

await axiosService.deleteItem('temples', 1);
```

### 文件上傳

```javascript
import { axiosService } from '@/services/axiosService';

// 上傳文件
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const result = await axiosService.uploadFile(file, {
  title: '文件標題',
  folder: 'uploads',
});

console.log('文件 ID:', result.data.data.id);
```

### 自定義業務 API

```javascript
import { axiosService } from '@/services/axiosService';
import { apiEndpoints } from '@/config/axiosConfig';

// 使用預定義的自定義端點
const temples = await axiosService.get(apiEndpoints.custom.temples);

const temple = await axiosService.get(apiEndpoints.custom.templeDetail(1));

// 或直接使用
const events = await axiosService.get('/items/events');
```

### Directus 查詢構建

```javascript
import { buildDirectusQuery, buildApiUrl } from '@/config/axiosConfig';
import { axiosService } from '@/services/axiosService';

// 構建複雜查詢
const queryParams = buildDirectusQuery({
  fields: ['id', 'name', 'status'],
  filter: {
    status: { _eq: 'active' },
    name: { _contains: '寺' },
  },
  sort: ['-created_at', 'name'],
  limit: 20,
  page: 1,
  search: '彰化',
});

// 使用查詢
const url = buildApiUrl('/items/temples', queryParams);
const response = await axiosService.get(url);
```

## 🔧 配置管理

### 環境變數切換

```bash
# .env.development - 開發環境（Mock 模式）
VITE_AUTH_MODE=mock
VITE_API_BASE_URL=http://localhost:3000

# .env.local - 本地測試 Directus
VITE_AUTH_MODE=directus
VITE_API_BASE_URL=http://localhost:3000

# .env.production - 生產環境
VITE_AUTH_MODE=directus
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 動態切換模式

```javascript
import { authService } from '@/services/authService';

// 切換到 Directus 模式
authService.setMode('directus');

// 切換到 Mock 模式
authService.setMode('mock');

// 檢查當前模式
console.log(authService.getCurrentMode()); // 'mock' 或 'directus'
```

### 檢查服務狀態

```javascript
import { axiosService } from '@/services/axiosService';
import { authService } from '@/services/authService';

// 檢查後端健康狀態
const health = await axiosService.checkHealth();
console.log('服務狀態:', health);

// 檢查連接延遲
const ping = await axiosService.ping();
console.log('延遲:', ping.latency);

// 檢查 Directus 狀態
const directusHealth = await authService.checkDirectusHealth();
console.log('Directus 狀態:', directusHealth);
```

## 🔐 Token 自動刷新

AxiosService 自動處理 token 刷新：

```javascript
// 不需要手動處理，攔截器會自動：
// 1. 檢測 401 錯誤
// 2. 嘗試刷新 token
// 3. 重試原請求
// 4. 刷新失敗則跳轉登入頁

// 也可以監聽認證失敗事件
window.addEventListener('auth:failed', () => {
  console.log('認證失敗，需要重新登入');
  // 自定義處理邏輯
});
```

## 📦 添加新的 API 端點

在 `axiosConfig.js` 中添加：

```javascript
export const apiEndpoints = {
  // ... 現有端點

  // 添加新的業務端點
  donations: {
    list: "/items/donations",
    detail: (id) => `/items/donations/${id}`,
    summary: "/custom/donations/summary",
    export: "/custom/donations/export",
  },

  reports: {
    monthly: "/custom/reports/monthly",
    annual: "/custom/reports/annual",
  },
};
```

使用新端點：

```javascript
import { axiosService } from '@/services/axiosService';
import { apiEndpoints } from '@/config/axiosConfig';

const donations = await axiosService.get(apiEndpoints.donations.list);
const summary = await axiosService.get(apiEndpoints.donations.summary);
```

## 🎨 Vue 組件範例

```vue
<template>
  <div>
    <button @click="handleLogin">登入</button>
    <button @click="loadTemples">載入寺廟</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '@/services/authService';
import { axiosService } from '@/services/axiosService';
import { apiEndpoints } from '@/config/axiosConfig';

const temples = ref([]);

const handleLogin = async () => {
  const result = await authService.login('admin@temple.com', 'password');
  if (result.success) {
    console.log('登入成功', result.data.user);
  } else {
    console.error('登入失敗', result.message);
  }
};

const loadTemples = async () => {
  try {
    const response = await axiosService.get(apiEndpoints.custom.temples);
    temples.value = response.data.data;
  } catch (error) {
    console.error('載入失敗', error);
  }
};
</script>
```

## 🚀 優勢總結

1. **集中管理** - 所有 URL 在一個檔案中
2. **易於維護** - 修改端點不需要搜尋整個專案
3. **類型安全** - 使用函數構建 URL，避免拼寫錯誤
4. **自動刷新** - Token 自動管理，無需手動處理
5. **錯誤處理** - 統一的錯誤處理機制
6. **靈活切換** - Mock 和 Directus 模式輕鬆切換
7. **可擴展** - 易於添加新的 API 端點

## 🔄 遷移指南

從舊配置遷移到新配置：

```javascript
// ❌ 舊方式
import { getApiUrl } from '@/config/auth';
const url = getApiUrl('/auth/login');

// ✅ 新方式
import { apiEndpoints } from '@/config/axiosConfig';
const url = apiEndpoints.auth.login;

// 或使用 axiosService 直接請求
import { axiosService } from '@/services/axiosService';
await axiosService.post(apiEndpoints.auth.login, data);
```