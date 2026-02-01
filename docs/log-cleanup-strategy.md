# 🗑️ MongoDB 日誌定期清理指南

## 📊 容量規劃（預留 20% 安全空間）

### 計算基礎
```
總容量: 512 MB
安全使用: 80% = 409.6 MB
預留空間: 20% = 102.4 MB (緊急緩衝)

單筆日誌: 3 KB
安全存儲上限: 409.6 MB ÷ 3 KB = 139,810 筆
```

---

## ⚠️ 容量警告閾值

| 使用率 | 日誌數量 | 狀態 | 行動 |
|-------|---------|------|------|
| < 50% | < 85,333 筆 | 🟢 安全 | 正常使用 |
| 50-70% | 85,333-119,466 筆 | 🟡 注意 | 開始規劃清理 |
| 70-80% | 119,466-139,810 筆 | 🟠 警告 | 立即執行清理 |
| > 80% | > 139,810 筆 | 🔴 危險 | **緊急清理！** |

---

## 🔄 定期清理策略

### 🤖 自動清理（已內建）⭐

**內建功能**: 服務器啟動時自動啟用  
**保留時間**: 90 天  
**清理頻率**: 每 7 天  
**特色**:
- ✅ 啟動時立即執行一次
- ✅ 防重入鎖避免重複執行  
- ✅ 詳細執行日誌與統計
- ✅ 優雅關閉處理
- ✅ 智能檢查：少於 5 萬筆跳過清理

**配置方式**:
```bash
# .env 文件配置
CLEANUP_INTERVAL_DAYS=7    # 清理頻率（天）
CLEANUP_RETAIN_DAYS=90     # 保留時間（天）
ENABLE_AUTO_CLEANUP=true   # 啟用自動清理
```

### 策略 1: 保守型（手動）

**保留時間**: 90 天  
**清理頻率**: 每週一次

```bash
# Crontab 設定
# 每週一凌晨 3:00 清理 90 天前的日誌
0 3 * * 1 curl -X DELETE http://localhost:3002/mongo/cleanup/90
```

**適用情境**:
- 中小型應用
- 每天 < 200 筆錯誤日誌
- 偶爾需要查看歷史錯誤

**預期效果**:
```
自動清理，無需手動設定
90 天 × 100 筆/天 = 9,000 筆
空間使用: 9,000 × 3 KB = 27 MB (5.3% 使用率) ✅
每 7 天自動清理一次，維持穩定使用量
```

**執行日誌範例**:
```
⏰ [2026-02-01T09:57:13.574Z] 開始自動清理...
   保留時間: 最近 90 天
📊 日誌數量較少 (8,766 筆)，跳過清理

# 或當日誌數量足夠時
⏰ [2026-02-01T09:57:13.574Z] 開始自動清理...
   保留時間: 最近 90 天
✅ 清理完成！
   刪除: 1,234 筆
   剩餘: 8,766 筆  
   節省: 約 3.61 MB
   耗時: 245ms
   下次: 2026-02-08 09:57:13
```

---

### 策略 2: 保守型（手動）

**保留時間**: 90 天  
**清理頻率**: 每週一次

---

### 策略 3: 平衡型（手動）

**保留時間**: 60 天  
**清理頻率**: 每週兩次

```bash
# 每週一和週四凌晨 3:00 清理
0 3 * * 1,4 curl -X DELETE http://localhost:3002/mongo/cleanup/60
```

**適用情境**:
- 中型應用
- 每天 200-500 筆錯誤日誌
- 只需查看近期錯誤

**預期效果**:
```
60 天 × 300 筆/天 = 18,000 筆
空間使用: 18,000 × 3 KB = 54 MB (10.5% 使用率) ✅
```

---

### 策略 4: 激進型（手動）

**保留時間**: 30 天  
**清理頻率**: 每天

```bash
# 每天凌晨 3:00 清理
0 3 * * * curl -X DELETE http://localhost:3002/mongo/cleanup/30
```

**適用情境**:
- 大型應用
- 每天 > 500 筆錯誤日誌
- 只需要最近數據

**預期效果**:
```
30 天 × 500 筆/天 = 15,000 筆
空間使用: 15,000 × 3 KB = 45 MB (8.8% 使用率) ✅
```

---

## 🛠️ 實作指南

### 內建自動清理（推薦）✨

**已內建在 log-server 中，無需額外設定！**

**功能特色**:
- 🚀 服務器啟動時自動啟用
- 🔒 防重入鎖避免重複執行
- 📊 詳細執行統計與日誌
- ⚙️ 環境變數配置
- 🛑 優雅關閉處理
- 🧠 智能檢查：少於 5 萬筆跳過清理

**配置方式**:
```bash
# .env 文件（可選配置）
CLEANUP_INTERVAL_DAYS=7    # 清理頻率（預設 7 天）
CLEANUP_RETAIN_DAYS=90     # 保留時間（預設 90 天）
ENABLE_AUTO_CLEANUP=true   # 啟用自動清理（預設 true）
```

**查看清理日誌**:
```bash
# 啟動 log-server 後會看到
✅ 已啟用自動清理任務
   清理頻率: 每 7 天
   保留時間: 90 天
   下次清理: 2026-02-08 17:57:13

# 執行時會顯示
⏰ [2026-02-01T09:57:13.574Z] 開始自動清理...
✅ 清理完成！刪除: 1,234 筆，剩餘: 8,766 筆
```

---

### 方法 1: Linux/Mac Cron Job（手動設定）

**步驟 1: 編輯 crontab**
```bash
crontab -e
```

**步驟 2: 加入清理任務**
```bash
# MongoDB 日誌自動清理
# 每週一凌晨 3:00 清理 90 天前的日誌
0 3 * * 1 curl -X DELETE http://localhost:3002/mongo/cleanup/90 >> /var/log/mongo-cleanup.log 2>&1

# 每月 1 號凌晨 4:00 執行容量檢查
0 4 1 * * cd /path/to/project && node capacity-monitor.js >> /var/log/mongo-capacity.log 2>&1
```

**步驟 3: 驗證設定**
```bash
# 列出目前的 cron jobs
crontab -l

# 查看清理日誌
tail -f /var/log/mongo-cleanup.log
```

---

### 方法 2: Windows 排程工作（手動設定）

**步驟 1: 建立清理腳本**

建立 `cleanup-logs.bat`:
```batch
@echo off
curl -X DELETE http://localhost:3002/mongo/cleanup/90
echo Cleanup completed at %date% %time% >> C:\logs\mongo-cleanup.log
```

**步驟 2: 建立排程工作**
1. 開啟「工作排程器」
2. 建立基本工作
3. 名稱: `MongoDB Logs Cleanup`
4. 觸發程序: 每週一凌晨 3:00
5. 動作: 啟動程式
6. 程式/指令碼: `C:\path\to\cleanup-logs.bat`

---

### 方法 3: Node.js 排程（手動設定，跨平台）

**安裝 node-cron**:
```bash
npm install node-cron
```

**建立 `auto-cleanup.js`**:
```javascript
import cron from 'node-cron';

const CLEANUP_URL = 'http://localhost:3002/mongo/cleanup';
const DAYS_TO_KEEP = 90;

// 每週一凌晨 3:00 執行清理
cron.schedule('0 3 * * 1', async () => {
  console.log(`🗑️  [${new Date().toISOString()}] 開始自動清理...`);
  
  try {
    const response = await fetch(`${CLEANUP_URL}/${DAYS_TO_KEEP}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ 清理完成: 刪除了 ${result.deletedCount} 筆舊日誌`);
    } else {
      console.error(`❌ 清理失敗: ${result.message}`);
    }
  } catch (error) {
    console.error(`❌ 清理錯誤: ${error.message}`);
  }
});

console.log('⏰ 自動清理排程已啟動');
console.log(`   - 保留時間: ${DAYS_TO_KEEP} 天`);
console.log('   - 執行時間: 每週一凌晨 3:00');

// 保持程序運行
process.on('SIGINT', () => {
  console.log('\n👋 停止自動清理排程');
  process.exit(0);
});
```

**執行**:
```bash
node auto-cleanup.js
```

**使用 PM2 保持運行**:
```bash
npm install -g pm2
pm2 start auto-cleanup.js --name "mongo-cleanup"
pm2 save
pm2 startup
```

---

## 📊 清理效果計算

### 範例計算（使用保守策略）

**假設**:
- 每天 100 筆錯誤日誌
- 保留 90 天
- 每週清理一次

**穩定狀態**:
```
日誌數量: 90 天 × 100 筆 = 9,000 筆
空間使用: 9,000 × 3 KB = 27 MB
使用率: 27 MB ÷ 512 MB = 5.3%

✅ 預留空間充足
✅ 永久可用
```

**清理效果**:
```
每週清理前: ~9,700 筆 (29.1 MB)
清理 7 天前的日誌: -700 筆 (-2.1 MB)
清理後: ~9,000 筆 (27 MB)

✅ 維持穩定使用量
```

---

## 🔍 監控與告警

### 監控腳本增強版

```javascript
// capacity-monitor-with-alert.js
const CAPACITY_THRESHOLD = 80; // 80% 使用率警告
const CLEANUP_URL = 'http://localhost:3002/mongo/cleanup';

async function checkAndAlert() {
  const stats = await getCapacityInfo();
  
  if (stats.usedPercentage > CAPACITY_THRESHOLD) {
    console.log('🚨 警告：容量超過 80%！');
    console.log('🔄 自動執行清理...');
    
    // 自動清理 90 天前的日誌
    const response = await fetch(`${CLEANUP_URL}/90`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    console.log(`✅ 緊急清理完成: 刪除 ${result.deletedCount} 筆`);
  }
}

// 每天檢查一次
cron.schedule('0 9 * * *', checkAndAlert);
```

---

## 📧 郵件通知（可選）

如果需要容量警告郵件：

```javascript
import nodemailer from 'nodemailer';

async function sendCapacityAlert(stats) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  });
  
  await transporter.sendMail({
    from: 'MongoDB Monitor',
    to: 'admin@yourcompany.com',
    subject: '⚠️ MongoDB 容量警告',
    text: `
      MongoDB Atlas 容量使用率已達 ${stats.usedPercentage}%
      
      目前狀況:
      - 總日誌數: ${stats.totalLogs}
      - 已使用: ${stats.usedSpaceMB} MB
      - 剩餘: ${stats.remainingMB} MB
      
      建議立即執行清理！
    `
  });
}
```

---

## 🎯 推薦配置總結

### 對你的專案（每天 ~100 筆錯誤）

**最佳配置**（已內建）:
```bash
# 無需額外設定！log-server 已內建自動清理
# 預設配置：每 7 天清理一次，保留 90 天

# 可選：自訂配置（.env 文件）
CLEANUP_INTERVAL_DAYS=7
CLEANUP_RETAIN_DAYS=90
ENABLE_AUTO_CLEANUP=true
```

**預期結果**:
- 穩定維持在 ~9,000 筆日誌
- 使用率 ~5%
- 預留 95% 空間
- **永久可用** ✅
- **零維護成本** ✅

**如需手動清理**:
```bash
# 手動清理 90 天前的日誌
curl -X DELETE http://localhost:3002/mongo/cleanup/90
```

---

## 📋 設定檢查清單

完成後確認：

- [x] **已內建自動清理功能** ✨
- [x] 清理頻率: 每 7 天
- [x] 保留時間: 90 天  
- [x] 防重入鎖保護
- [x] 詳細執行日誌
- [x] 優雅關閉處理
- [ ] 已測試清理功能（可選）
- [ ] 已設定自訂配置（可選）
- [ ] 已設定容量監控（可選）

**內建功能已涵蓋大部分需求，無需額外設定！** 🎉

---

## 🧪 測試清理功能

### 手動測試
```bash
# 測試清理 API
curl -X DELETE http://localhost:3002/mongo/cleanup/90

# 預期回應
{
  "success": true,
  "deletedCount": 123,
  "message": "已清理 123 筆舊日誌"
}
```

### 驗證 Cron Job
```bash
# 手動執行一次看看
/bin/sh -c "curl -X DELETE http://localhost:3002/mongo/cleanup/90"

# 查看 cron 執行記錄
grep CRON /var/log/syslog
# 或
tail -f /var/log/cron
```

---

## 💡 最佳實踐

1. **預留 20% 安全空間** ✅
2. **定期清理（每週）** ✅
3. **保留 90 天歷史** ✅
4. **監控容量（每月）** ✅
5. **記錄清理日誌** ✅
6. **測試清理功能** ✅

---

## 🎓 Crontab 時間格式說明

```
* * * * * 指令
│ │ │ │ │
│ │ │ │ └─ 星期幾 (0-7, 0 和 7 都是星期日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小時 (0-23)
└───────── 分鐘 (0-59)
```

**常用範例**:
```bash
# 每天凌晨 3:00
0 3 * * *

# 每週一凌晨 3:00
0 3 * * 1

# 每月 1 號凌晨 3:00
0 3 1 * *

# 每週一和週四凌晨 3:00
0 3 * * 1,4

# 每 6 小時
0 */6 * * *
```

---

**設定完成後就可以放心使用了！** 🎉
