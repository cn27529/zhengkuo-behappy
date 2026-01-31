# 符號連結查看快速參考

## 🔍 快速查看命令

### 最常用的命令

```bash
# 查看單個符號連結
ls -l db/current.db

# 查看目錄下所有文件（符號連結會特別標示）
ls -l db/

# 只顯示符號連結指向的目標
readlink db/current.db

# 使用我們的檢查工具（推薦）
node scripts/check-symlinks.js
```

## 📋 詳細命令說明

### 1. `ls -l`（最基本）

```bash
$ ls -l db/current.db

# 輸出格式解讀：
lrwxr-xr-x  1 user  staff  10 Jan 30 12:00 current.db -> shaolin.db
│││││││││  │  │     │      │         │              └─> 指向目標
││││││││└─ 其他人權限(讀+執行)                    └─> 符號連結名稱
│││││││└── 群組權限(讀+寫+執行)              └─> 修改日期時間
││││││└─── 擁有者權限(讀+寫+執行)      └─> 連結長度（字節）
│││││└──── 權限類型
││││└───── 檔案類型
│││└────── l = 符號連結
││└─────── r = 讀取權限
│└──────── w = 寫入權限
└───────── x = 執行權限
```

**判斷符號連結的關鍵：**

- 第一個字母是 `l`
- 最後有 `->` 箭頭指向目標

### 2. `ls -la`（顯示所有文件，包含隱藏）

```bash
$ ls -la db/

# 輸出示例：
total 98312
drwxr-xr-x   6 user  staff      192 Jan 30 12:00 .
drwxr-xr-x  15 user  staff      480 Jan 30 11:30 ..
-rw-r--r--   1 user  staff  12582912 Jan 30 11:30 data.db
lrwxr-xr-x   1 user  staff       10 Jan 30 12:00 current.db -> shaolin.db
-rw-r--r--   1 user  staff  12582912 Jan 30 11:45 shaolin.db
-rw-r--r--   1 user  staff  12582912 Jan 30 11:46 ziyun.db
```

### 3. `readlink`（直接讀取目標）

```bash
# 基本用法
$ readlink db/current.db
shaolin.db

# 顯示絕對路徑
$ readlink -f db/current.db
/Users/username/project/db/shaolin.db

# 如果不是符號連結，不會輸出任何內容
$ readlink db/data.db
# (沒有輸出)
```

### 4. `file`（識別文件類型）

```bash
$ file db/current.db
db/current.db: symbolic link to shaolin.db

$ file db/data.db
db/data.db: SQLite 3.x database
```

### 5. `stat`（詳細信息）

```bash
$ stat db/current.db

# macOS 輸出：
  File: "db/current.db" -> "shaolin.db"
  Size: 10         FileType: Symbolic Link
  Mode: (0755/lrwxr-xr-x)         Uid: ( 501/   user)   Gid: (  20/   staff)
...

# Linux 輸出：
  File: db/current.db -> shaolin.db
  Size: 10         Blocks: 0          IO Block: 4096   symbolic link
Device: 801h/2049d    Inode: 1234567     Links: 1
...
```

## 🔎 進階查詢

### 只列出符號連結

```bash
# 方法 1: 使用 grep
ls -l db/ | grep "^l"

# 方法 2: 使用 find
find db/ -type l

# 方法 3: 使用 find 顯示詳細信息
find db/ -type l -ls
```

### 查找所有符號連結（遞歸）

```bash
# 在當前目錄及子目錄查找
find . -type l

# 只在 db 目錄查找
find db/ -type l

# 顯示完整信息
find . -type l -exec ls -l {} \;
```

### 檢查符號連結是否有效

```bash
# 查找損壞的符號連結（目標不存在）
find db/ -type l ! -exec test -e {} \; -print

# 或使用 -xtype
find db/ -xtype l

# 只顯示有效的符號連結
find db/ -type l -exec test -e {} \; -print
```

### 查看符號連結指向的真實路徑

```bash
# 方法 1: readlink
readlink -f db/current.db

# 方法 2: realpath (某些系統)
realpath db/current.db

# 方法 3: 在 macOS 上沒有 realpath，可以用
greadlink -f db/current.db  # 需要安裝 coreutils
```

## 🛠️ 使用專用檢查工具

### 基本用法

```bash
# 檢查 db 目錄下的所有符號連結（互動模式）
node scripts/check-symlinks.js

# 輸出示例：
🔍 符號連結檢查工具

📂 掃描目錄: /path/to/db

🔗 符號連結列表
================================================================================

📄 current.db
   路徑: /path/to/db/current.db
   指向: shaolin.db
   ✓ 狀態: 有效
   大小: 12.45 MB

📄 backup.db
   路徑: /path/to/db/backup.db
   指向: missing.db
   ❌ 狀態: 損壞 (目標不存在)

是否要刪除損壞的符號連結 "backup.db"？(y/n): y
✅ 已刪除損壞的符號連結: backup.db

================================================================================

📊 統計:
   總數: 2
   ✓ 有效: 1
   ✗ 損壞: 1 (已處理)
```

### 檢查特定文件

```bash
# 檢查特定符號連結
node scripts/check-symlinks.js db/current.db

# 輸出示例：
🔗 符號連結信息
================================================================================
   文件: current.db
   完整路徑: /path/to/db/current.db
   指向: shaolin.db
   ✓ 狀態: 有效
   目標大小: 12.45 MB
   完整目標路徑: /path/to/db/shaolin.db
================================================================================
```

### 互動式損壞連結處理

當發現損壞的符號連結時，工具會自動詢問是否刪除：

```bash
# 發現損壞連結時的互動
📄 current.db
   路徑: /path/to/db/current.db
   指向: missing.db
   ❌ 狀態: 損壞 (目標不存在)

是否要刪除損壞的符號連結 "current.db"？(y/n): y
✅ 已刪除損壞的符號連結: current.db
```

## 🪟 Windows 命令

### PowerShell

```powershell
# 查看符號連結
Get-Item db\current.db | Select-Object LinkType, Target

# 列出目錄中的所有符號連結
Get-ChildItem db\ | Where-Object {$_.LinkType} | Select-Object Name, LinkType, Target

# 詳細信息
Get-Item db\current.db | Format-List *
```

### CMD

```cmd
# 查看符號連結
dir db\current.db

# 只顯示符號連結和目錄連結
dir db /AL

# 顯示詳細信息
fsutil reparsepoint query db\current.db
```

## 📊 實用組合

### 1. 快速檢查當前資料庫連接

```bash
# 一行命令顯示當前使用的資料庫
echo "當前資料庫: $(readlink db/current.db)"

# 或
ls -l db/current.db | awk '{print "當前資料庫:", $NF}'
```

### 2. 列出所有資料庫及當前連接

```bash
# 顯示所有 .db 文件和當前連接
ls -lh db/*.db

# 加上顏色（macOS/Linux）
ls -lh --color=auto db/*.db  # Linux
ls -lhG db/*.db              # macOS
```

### 3. 檢查符號連結是否指向正確的文件

```bash
# 檢查並驗證
TARGET=$(readlink db/current.db)
if [ -f "db/$TARGET" ]; then
    echo "✓ 符號連結有效，指向: $TARGET"
else
    echo "✗ 符號連結損壞！目標不存在: $TARGET"
fi
```

## 📝 添加到 package.json

```json
{
  "scripts": {
    "check:symlinks": "node scripts/check-symlinks.js",
    "check:db": "node scripts/check-symlinks.js db/current.db",
    "show:current-db": "readlink db/current.db",
    "clean:symlinks": "node scripts/check-symlinks.js"
  }
}
```

使用：

```bash
npm run check:symlinks    # 檢查所有符號連結（互動模式）
npm run check:db          # 檢查特定符號連結
npm run show:current-db   # 快速顯示當前資料庫
npm run clean:symlinks    # 清理損壞的符號連結
```

## 🎯 快速參考表

| 需求                 | 命令                             |
| -------------------- | -------------------------------- |
| 查看單個符號連結     | `ls -l db/current.db`            |
| 只顯示目標           | `readlink db/current.db`         |
| 顯示絕對路徑         | `readlink -f db/current.db`      |
| 列出目錄所有符號連結 | `find db/ -type l`               |
| 檢查是否有效         | `file db/current.db`             |
| 詳細信息             | `stat db/current.db`             |
| 使用工具檢查         | `node scripts/check-symlinks.js` |
| 互動式清理損壞連結   | `node scripts/check-symlinks.js` |

## 💡 提示

### 符號連結的視覺識別

在大多數終端中，符號連結會有特殊的視覺標示：

- **顏色**: 通常是青色或藍綠色
- **箭頭**: 顯示 `->` 指向目標
- **類型**: `ls -l` 第一個字母是 `l`

### macOS/Linux 別名設置

添加到 `.bashrc` 或 `.zshrc`：

```bash
# 別名
alias lsl='ls -la | grep "^l"'  # 只顯示符號連結
alias checkdb='readlink db/current.db && ls -lh db/current.db'

# 函數
checklink() {
    if [ -L "$1" ]; then
        echo "✓ 符號連結: $1 -> $(readlink "$1")"
    else
        echo "✗ 不是符號連結: $1"
    fi
}
```

使用：

```bash
lsl                    # 列出當前目錄的符號連結
checkdb                # 檢查資料庫連接
checklink db/current.db # 檢查特定連結
```

## 🔧 故障排除

### 符號連結顯示為普通文件？

可能是查看工具追蹤了符號連結：

```bash
# 使用 lstat 而非 stat
ls -l db/current.db    # 顯示符號連結本身
ls -L db/current.db    # 追蹤並顯示目標文件
```

### 符號連結損壞？

```bash
# 檢查目標是否存在
ls -l db/current.db
# 如果顯示紅色或有特殊標記，表示目標不存在

# 使用工具互動式清理
node scripts/check-symlinks.js
# 工具會自動詢問是否刪除損壞的連結

# 手動重新創建
rm db/current.db
ln -s shaolin.db db/current.db
```

### Windows 上看不到符號連結？

```powershell
# 確保有足夠的權限
Get-Item db\current.db -Force | Select-Object *

# 或使用管理員權限的 PowerShell
```

## 📚 相關資源

- [db-start-with-db-guide.md](./db-start-with-db-guide.md) - 資料庫管理工具指南
- [db-init-database-guide.md](./db-init-database-guide.md) - 資料庫初始化工具指南
