# Windows Rust 開發環境建置 SOP（GNU 路線，不依賴 .NET / Visual Studio）

> **目標**：使用 MSYS2 + MinGW64 工具鏈，讓 Rust 在 Windows 上透過 GNU 路線編譯，完全不需要 Visual Studio 或 .NET 相關工具。

---

## 前置條件

| 項目 | 說明 |
|------|------|
| 安裝磁碟 | 本文以 `D:\` 槽為例 |
| 目標架構 | x86_64（64-bit） |
| C 工具鏈來源 | MSYS2 MinGW64 |

---

## Step 1：安裝 MSYS2

1. 前往官網下載安裝包：https://www.msys2.org/
2. 執行安裝，**將安裝路徑改為** `D:\msys64`
3. 安裝完成後，從開始選單開啟 **MSYS2 MINGW64** 視窗（注意：要選 MINGW64，不是 MSYS 或 UCRT64）

> ⚠️ **重要**：後續所有 MSYS2 操作都在 **MINGW64** 視窗進行，不是 MSYS2 MSYS 視窗。

---

## Step 2：在 MSYS2 安裝 MinGW64 工具鏈

在 **MINGW64** 視窗執行：

```bash
pacman -Syu
```

> 若視窗要求重啟，關掉後重新開啟 MINGW64 視窗再繼續。

接著安裝完整工具鏈：

```bash
pacman -S mingw-w64-x86_64-toolchain
```

出現選單時直接按 Enter 選全部安裝。

這個套件包含：
- `gcc` — C 編譯器
- `ld` — 連結器（linker）
- `dlltool.exe` — DLL import library 工具（Rust GNU 路線必需）
- `ar`, `as`, `objcopy` 等 binutils 工具

---

## Step 3：確認 GNU 工具鏈完整

在 **MINGW64** 視窗依序執行以下四個指令，確認每個工具都有回應版本號：

```bash
gcc --version
ld --version
ar --version
dlltool --version
```

預期輸出範例：

```
gcc (Rev3, Built by MSYS2 project) 13.X.0
...
GNU ld (GNU Binutils) 2.XX
...
GNU ar (GNU Binutils) 2.XX
...
GNU dlltool (GNU Binutils) 2.XX
```

接著確認各工具的實際路徑：

```bash
which gcc
which ld
which ar
which dlltool
```

四個指令都應回傳 `/mingw64/bin/` 開頭的路徑，例如：

```
/mingw64/bin/gcc
/mingw64/bin/ld
/mingw64/bin/ar
/mingw64/bin/dlltool
```

> ⚠️ 若路徑是 `/usr/bin/` 開頭，表示抓到的是 MSYS 版本，不是 MinGW64 版本，Rust 連結時會出錯。請確認開啟的是 **MINGW64** 視窗而非 MSYS 視窗。

若任一工具無法執行或找不到，請重新執行 Step 2。

---

## Step 4：設定 Windows 系統環境變數 Path

1. 按 `Win + S` 搜尋「**編輯系統環境變數**」並開啟
2. 點擊「**環境變數**」
3. 在「**系統變數**」區塊找到 `Path`，點擊「編輯」
4. 點擊「新增」，加入以下路徑：

```
D:\msys64\mingw64\bin
```

5. 按確定儲存，**關閉所有終端機視窗後重新開啟**

> ⚠️ 不重啟終端機的話，Path 變更不會生效。

### 驗證 Path 設定

開啟新的 **PowerShell** 或 **Git Bash** 視窗，執行：

```powershell
where dlltool
```

預期輸出：

```
D:\msys64\mingw64\bin\dlltool.exe
```

若沒有輸出，請確認 Step 4 路徑是否正確，且有重新開啟終端機。

---



## Step 5：建置 Rust 專案

進入你的 Rust 專案目錄：

```powershell
cd D:\your-project
cargo build
```

首次建置會下載依賴套件，耗時較長屬正常。

成功時最後幾行應看到：

```
   Compiling your-project vX.X.X (D:\your-project)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in X.XXs
```

---

## 常見問題排查

### ❌ `error: linker 'gcc' not found`

**原因**：`D:\msys64\mingw64\bin` 未加入系統 Path，或終端機未重新開啟。

**解決**：
1. 確認 Step 4 路徑正確
2. 完全關閉並重新開啟終端機
3. 執行 `where gcc` 確認能找到路徑

---

### ❌ `could not find native static library 'pthread'`

**原因**：MinGW64 工具鏈安裝不完整。

**解決**：在 MINGW64 視窗重新執行：
```bash
pacman -S mingw-w64-x86_64-toolchain
```

---

### ❌ `where dlltool` 找不到但 MSYS2 有安裝

**原因**：Path 設定了 `D:\msys64\usr\bin` 而非 `D:\msys64\mingw64\bin`，兩個目錄裡的工具不同。

**解決**：確認 Path 中是 `mingw64\bin`，不是 `usr\bin`。

---

### ❌ cargo build 出現 `undefined reference`

**原因**：GNU 工具鏈版本過舊或某些 pacman 套件未安裝。

**解決**：在 MINGW64 視窗更新所有套件：
```bash
pacman -Syu
```

---

## 環境總覽

```
    D:\msys64\mingw64\bin\
        ├── gcc.exe       ← C 編譯器 / 連結器入口
        ├── ld.exe        ← GNU 連結器
        └── dlltool.exe   ← DLL import library 工具
```

---

## 各工具角色速查

| 工具 | 來源 | 用途 |
|------|------|------|
| `rustc` | Rust 官方 | Rust 編譯器本體 |
| `cargo` | Rust 官方 | 專案建置與套件管理 |
| `MSYS2` | msys2.org | 提供 Windows 上的 GNU 工具環境 |
| `gcc` / `ld` | MSYS2 MinGW64 | C 工具鏈，負責最終連結 |
| `dlltool.exe` | MSYS2 MinGW64 | 處理 Windows DLL 連結，GNU 路線必需 |

---

*文件版本：v1.1 ／ 適用平台：Windows 10 / 11 x86_64*
