# 開發菜單管理指南

## 概述說明

菜單系統架構

### 雙重控制屬性

每個菜單項目有兩個獨立的控制屬性：

```javascript
{
  id: 1,
  name: "功能名稱",
  enabled: true,    // 開發時控制：true=顯示, false=隱藏
  publish: true,    // 部署時控制：true=發布, false=不發布
}
```

### 四種狀態組合

| enabled | publish | 開發環境 | 生產環境 | 使用場景         |
| ------- | ------- | -------- | -------- | ---------------- |
| `true`  | `true`  | ✅ 顯示  | ✅ 顯示  | 完成的功能       |
| `true`  | `false` | ✅ 顯示  | ❌ 隱藏  | 開發中功能       |
| `false` | `true`  | ❌ 隱藏  | ✅ 顯示  | 暫時關閉但要發布 |
| `false` | `false` | ❌ 隱藏  | ❌ 隱藏  | 完全停用         |

## 開發流程

### 新功能開發

1. **初期開發**：`enabled: true, publish: false`
   - 開發時可以看到和測試
   - 部署時不會暴露給用戶

2. **功能完成**：`enabled: true, publish: true`
   - 開發和生產環境都顯示

### 功能維護

1. **暫時關閉**：`enabled: false, publish: true`
   - 開發時隱藏（不干擾開發）
   - 生產環境仍然可用

2. **完全停用**：`enabled: false, publish: false`
   - 兩個環境都隱藏

## 實際操作

### 添加新菜單項目

```javascript
{
  id: 12,
  name: "新功能",
  path: "/new-feature",
  icon: "🆕",
  component: "NewFeature",
  requiredAuth: true,
  order: 12,
  enabled: true,     // 開發時顯示
  publish: false,    // 先不發布
}
```

### 發布功能到生產環境

只需要修改一個屬性：

```javascript
publish: false,  // 改為
publish: true,   // 就會在下次部署時發布
```

### 暫時隱藏功能

```javascript
enabled: false,  // 開發時不顯示
publish: true,   // 但生產環境保持可用
```

### 1. 菜單結構設計

每個菜單項目都有兩個控制屬性：

- `enabled` - 控制開發時是否顯示（開發邏輯）
- `publish` - 控制生產環境是否發布（部署邏輯）

```javascript
{
  id: 1,
  name: "儀表板",
  path: "/dashboard",
  icon: "📊",
  component: "Dashboard",
  requiredAuth: true,
  order: 1,
  enabled: true,    // 開發時顯示
  publish: true,    // 生產環境發布
},
{
  id: 6,
  name: "卡片設計",
  path: "/card-design",
  icon: "💳",
  component: "CardDesign",
  requiredAuth: true,
  order: 6,
  enabled: true,    // 開發時顯示
  publish: false,   // 生產環境不發布
}
```

### 2. 過濾邏輯

在 `availableMenuItems` 中實現雙重過濾：

```javascript
const availableMenuItems = computed(() => {
  const isProduction = process.env.NODE_ENV === "production";

  return menuItems.value
    .filter((item) => {
      if (!item.enabled) return false; // 開發邏輯
      if (isProduction && item.publish === false) return false; // 部署邏輯
      return true;
    })
    .sort((a, b) => a.order - b.order);
});
```

### 部署後檢查

1. 開發環境：所有 `enabled: true` 的項目都顯示
2. 生產環境：只有 `enabled: true` 且 `publish: true` 的項目顯示

## 常見場景

### 場景一：開發新功能

```javascript
// 開發階段
enabled: true, publish: false

// 測試完成後
enabled: true, publish: true
```

### 場景二：緊急隱藏功能

```javascript
// 生產環境有問題，先隱藏
enabled: false, publish: false

// 修復後重新啟用
enabled: true, publish: true
```

### 場景三：A/B 測試

```javascript
// 功能 A
enabled: true, publish: true

// 功能 B（測試版）
enabled: true, publish: false
```

## 注意事項

1. **不要直接修改 enabled 來控制部署** - 會影響開發體驗
2. **publish 是部署專用屬性** - 只影響生產環境
3. **部署前檢查 publish 狀態** - 確保不會意外發布未完成功能
4. **保持文檔更新** - 記錄每個功能的狀態變更

## 技術實現

### 過濾邏輯位置

`client/src/stores/menu.js` 的 `availableMenuItems` computed

### 環境判斷

生產環境：`process.env.NODE_ENV === 'production'`

---

_記錄日期：2026-01-27_  
_作者：趁著還在地球上的開發者_ 🌍→🚀
