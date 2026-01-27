# Netlify 部署指南

## 問題描述

在開發過程中，需要將 `zk-client-rustaxum` 分支的內容部署到 `zk-client-netlify` 分支，但某些功能（菜單項目）不希望在生產環境中顯示。

## 解決方案：publish 屬性 + 自動化腳本

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
  const isProduction = process.env.NODE_ENV === 'production';
  
  return menuItems.value
    .filter((item) => {
      if (!item.enabled) return false;                    // 開發邏輯
      if (isProduction && item.publish === false) return false;  // 部署邏輯
      return true;
    })
    .sort((a, b) => a.order - b.order);
});
```

### 3. 自動化部署腳本

`scripts/deploy-netlify.sh` 實現一鍵部署：

```bash
#!/bin/bash

echo "🚀 開始部署到 Netlify..."

# 1. 切換到部署分支
git checkout zk-client-netlify

# 2. 重設為開發分支內容
git reset --hard zk-client-rustaxum

# 3. 提交變更
git add .
git commit -m "Deploy: Production build with publish filter"

# 4. 推送到遠端
git push origin zk-client-netlify --force

echo "✅ 部署完成！"
echo "📝 Netlify 會自動設置 NODE_ENV=production 來觸發 publish 過濾"
```

### 4. 使用方式

**開發時**：
- `enabled: true` + `publish: false` = 開發時顯示，生產時隱藏
- `enabled: false` + `publish: false` = 開發時隱藏，生產時隱藏

**部署時**：
```bash
# 方式一：直接執行
./scripts/deploy-netlify.sh

# 方式二：npm 命令
npm run deploy:netlify
```

## 優勢

1. **開發不受影響** - `enabled` 控制開發時顯示
2. **部署自動化** - `publish` 控制生產環境發布
3. **一鍵部署** - 不需要手動修改菜單
4. **清晰分離** - 開發邏輯與部署邏輯分離

## 總結

通過 `publish` 屬性 + 自動化腳本的組合，實現了：
- 保持開發流程不變
- 自動控制生產環境菜單顯示
- 一鍵部署，無需手動操作

只需要將想要發布的菜單項目設置為 `publish: true` 即可！
