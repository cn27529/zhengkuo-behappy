# RustMyDataService 集成說明

## 已完成的文件

### 1. Rust 服務層 (`client/src/rustServices/rustMyDataService.js`)
實現了與 `mydataService.js` 相同的方法接口：

#### CRUD 操作
- `getAllMydata(params, context)` - 獲取所有 MyData
- `getMydataById(id, context)` - 根據 ID 獲取單筆
- `createMydata(mydataData, additionalContext)` - 創建新記錄
- `updateMydata(id, mydataData, context)` - 更新記錄
- `deleteMydata(id, context)` - 刪除記錄

#### 高級查詢方法
- `getMydataByFormName(formName, context)` - 根據表單名稱查詢
- `getMydataByState(state, context)` - 根據狀態查詢
- `searchMydata(keyword, context)` - 搜索功能

#### 錯誤處理與模式管理
- `handleMydataDirectusError(error)` - 錯誤處理
- `getCurrentMode()` - 獲取當前模式
- `setMode(mode)` - 設置模式（保持接口兼容）

### 2. 基礎服務配置 (`client/src/rustServices/baseRustService.js`)
✅ 已添加 `myData: "/api/my-data"` 端點配置

### 3. 服務適配器 (`client/src/adapters/serviceAdapter.js`)
已完成以下集成：

#### 導入服務
```javascript
import { mydataService as directusMydata } from "../services/mydataService.js";
import { rustMyDataService } from "../rustServices/rustMyDataService.js";
```

#### 服務映射
- ✅ 添加到 `directusServices` 映射
- ✅ 添加到 `loadRustServices()` 動態加載
- ✅ 添加到 `_initializeFlatMethods()` 扁平化方法
- ✅ 添加 `mydataService` getter

## 使用方式

### 方式 1：通過 serviceAdapter 直接調用（推薦）
```javascript
import { serviceAdapter } from '@/adapters/serviceAdapter.js';

// 獲取所有 MyData
const result = await serviceAdapter.getAllMydata();

// 根據 ID 獲取
const data = await serviceAdapter.getMydataById(id);

// 創建記錄
const created = await serviceAdapter.createMydata({
  state: 'active',
  formName: '聯絡表單',
  contact: {
    name: '張三',
    phone: '0912345678'
  }
});

// 更新記錄
const updated = await serviceAdapter.updateMydata(id, {
  state: 'completed'
});

// 刪除記錄
await serviceAdapter.deleteMydata(id);

// 根據狀態查詢
const activeData = await serviceAdapter.getMydataByState('active');
```

### 方式 2：通過服務訪問器（向後兼容）
```javascript
import { serviceAdapter } from '@/adapters/serviceAdapter.js';

const mydataService = serviceAdapter.mydataService;

// 使用方式與方式 1 相同
const result = await mydataService.getAllMydata();
```

### 方式 3：直接使用 Rust 服務
```javascript
import { rustMyDataService } from '@/rustServices/rustMyDataService.js';

const result = await rustMyDataService.getAllMydata();
```

## 自動後端切換

serviceAdapter 會根據配置自動選擇後端：
- `VITE_BACKEND_TYPE=axum` → 使用 Rust 後端
- `VITE_BACKEND_TYPE=directus` → 使用 Directus 後端
- 支持自動降級（Rust 失敗時自動切換到 Directus）

## 方法對照表

| mydataService.js | rustMyDataService.js | 說明 |
|-----------------|---------------------|------|
| getAllMydata | getAllMydata | 獲取所有記錄 |
| getMydataById | getMydataById | 根據 ID 獲取 |
| createMydata | createMydata | 創建記錄 |
| updateMydata | updateMydata | 更新記錄 |
| deleteMydata | deleteMydata | 刪除記錄 |
| getMydataByFormName | getMydataByFormName | 根據表單名稱查詢 |
| getMydataByState | getMydataByState | 根據狀態查詢 |
| searchMydata | searchMydata | 搜索功能 |
| handleMydataDirectusError | handleMydataDirectusError | 錯誤處理 |
| getCurrentMode | getCurrentMode | 獲取模式 |
| setMode | setMode | 設置模式 |

## 特性

✅ 完全兼容 `mydataService.js` 的方法簽名
✅ 支持查詢參數（分頁、排序、過濾）
✅ JSON 字段 `contact` 自動處理
✅ 統一的錯誤處理
✅ 日誌記錄與追蹤
✅ Mock 模式支持
✅ 自動後端切換與降級

## 測試

可以使用之前創建的測試腳本：
```bash
./scripts/test_rust_mydata_api.sh
```

## 注意事項

1. **方法名稱一致性**：所有方法名稱與 `mydataService.js` 完全一致，確保無縫切換
2. **參數格式**：支持 Directus 風格的查詢參數（`filter`, `sort`, `limit`, `offset`）
3. **錯誤處理**：統一使用 `baseRustService` 的錯誤處理機制
4. **日誌追蹤**：所有請求都會記錄到日誌服務器（如果配置）
