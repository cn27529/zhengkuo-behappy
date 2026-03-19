# Windows Rust 建構環境設定手冊（MSYS2 + GNU 模式）

## 概述說明

本文檔提供在 Windows 環境下使用 MSYS2 與 GNU 工具鏈建構 Rust 專案的完整設定指南。**本專案統一使用 `D:\msys64\mingw64` 工具鏈編譯 Rust，包含 cargo 與 rustc，不使用 rustup 安裝腳本，不切換 GNU / MSVC 工具鏈，亦不執行任何 `rustup` 相關指令。** 所有編譯行為均由 MSYS2 MinGW64 工具鏈與 `config.toml` 設定驅動。包含 MSYS2 安裝、MinGW-w64 工具鏈配置，以及常見編譯問題的解決方案。

## 適用情境

- 客戶端現場無法使用 MSVC（無 Windows SDK / C 槽空間不足）
- 專案依賴需要 GNU 工具鏈（如 `ring`、`libsqlite3-sys`）
- 希望在 Windows 上建立穩定、可複現的 Rust 編譯環境

---

## 0. 快速安裝清單（現場速查）

> 📌 第一次設定請直接從第 1 章開始逐步操作。本節為熟悉流程後的現場速查用。

| 步驟 | 指令 / 動作                                             | 預期結果                                  |
| ---- | ------------------------------------------------------- | ----------------------------------------- |
| 1    | 安裝 MSYS2，路徑設為 `D:\msys64`                        | 安裝完成                                  |
| 2    | MINGW64 視窗執行 `pacman -Syu`                          | 更新完成（可能重啟視窗）                  |
| 3    | MINGW64 視窗執行 `pacman -S mingw-w64-x86_64-toolchain` | gcc / cargo / rustc 安裝完成              |
| 4    | 系統 PATH 加入 `D:\msys64\mingw64\bin`                  | 重開 PowerShell 後 `gcc --version` 有回應 |
| 5    | 建立 `~\.cargo\config.toml`，填入 linker / ar / CC 設定 | `cat` 確認內容正確                        |
| 6    | PowerShell Profile 加入 `$env:CC="gcc"` 等三行          | `. $PROFILE` 後 `$env:CC` 有值            |
| 7    | `cargo build` 建構專案                                  | `Finished dev [unoptimized + debuginfo]`  |

> ⚠️ **重要**：所有 MSYS2 操作均在 **MINGW64** 視窗進行，不是 MSYS 或 UCRT64 視窗。

---

## 1. 安裝 MSYS2（提供 GNU 工具鏈）

### 1.1 下載並安裝 MSYS2

- 官方下載頁：https://www.msys2.org
- 下載 `msys2-x86_64-xxx.exe`
- **安裝目錄建議：`D:\msys64`**（避免佔用 C 槽）
- 或者在已經有安裝 msys64 的 Windows 系統中拷貝整個 msys64 資料夾也可行（約 1.5 GB）

安裝完成後，從開始選單開啟 **MSYS2 MINGW64** 視窗。

> ⚠️ **重要**：後續所有 MSYS2 操作都在 **MINGW64** 視窗進行，不是 MSYS2 MSYS 或 UCRT64 視窗。

### 1.2 安裝 MinGW-w64 工具鏈

在 **MSYS2 MINGW64** 終端機中執行：

```bash
pacman -Syu          # 首次更新（可能會關閉終端）
# 重新開啟 MINGW64 終端機後繼續
pacman -Su           # 完成剩餘更新
pacman -S mingw-w64-x86_64-toolchain  # 安裝 gcc, g++, rustc, cargo, make, ar 等
```

出現套件選單時直接按 Enter 選全部安裝。此套件包含：

| 工具              | 用途                                         |
| ----------------- | -------------------------------------------- |
| `gcc`             | C 編譯器 / 連結器入口                        |
| `ld`              | GNU 連結器                                   |
| `ar`              | 靜態函式庫打包工具                           |
| `dlltool.exe`     | DLL import library 工具（Rust GNU 路線必需） |
| `cargo` / `rustc` | Rust 套件管理與編譯器本體                    |

---

## 2. 將 MSYS2 工具加入 Windows PATH（供 PowerShell 使用）

### 2.1 加入系統環境變數

1. 按 `Win + S` 搜尋「**編輯系統環境變數**」並開啟
2. 點擊「**環境變數**」
3. 在「**系統變數**」區塊找到 `Path`，點擊「編輯」
4. 點擊「新增」，依序加入以下路徑：

```
D:\msys64\mingw64\bin
D:\msys64\usr\bin
```

5. 按確定儲存，**關閉所有終端機視窗後重新開啟**

> ⚠️ 不重啟終端機的話，Path 變更不會生效。

### 2.2 驗證 PATH（在 PowerShell 中測試）

```powershell
gcc --version      # 應顯示版本資訊
make --version     # 應顯示版本資訊
where dlltool      # 預期輸出：D:\msys64\mingw64\bin\dlltool.exe
```

同時確認各工具實際存在：

```powershell
Test-Path "D:\msys64\mingw64\bin\gcc.exe"
Test-Path "D:\msys64\mingw64\bin\g++.exe"
Test-Path "D:\msys64\mingw64\bin\ar.exe"
Test-Path "D:\msys64\mingw64\bin\dlltool.exe"
Test-Path "D:\msys64\mingw64\bin\rustc.exe"
Test-Path "D:\msys64\mingw64\bin\cargo.exe"
```

六個指令都應回傳 `True`。若出現 `False`，請回到 1.2 重新安裝工具鏈。

> ⚠️ 若 `where dlltool` 無輸出，請確認 Path 設定的是 `mingw64\bin`，不是 `usr\bin`，兩個目錄的工具不同。

---

## 3. 驗證所有工具路徑（確認均來自 `D:\msys64\mingw64`）

安裝完成後，在 **MSYS2 MINGW64** 終端機中執行 `which` 確認來源路徑，**所有工具都必須來自 `/d/msys64/mingw64/bin/`**：

```bash
which rustc
which cargo
which gcc
which g++
which ar
which dlltool
```

預期輸出（每行路徑均應為 `/d/msys64/mingw64/bin/` 開頭）：

```
/d/msys64/mingw64/bin/rustc
/d/msys64/mingw64/bin/cargo
/d/msys64/mingw64/bin/gcc
/d/msys64/mingw64/bin/g++
/d/msys64/mingw64/bin/ar
/d/msys64/mingw64/bin/dlltool
```

> ⚠️ 若任何工具路徑為 `/usr/bin/` 開頭，表示抓到的是 MSYS 版本而非 MinGW64 版本，請確認開啟的是 **MINGW64** 視窗，並確認 PATH 中 `D:\msys64\mingw64\bin` 排在 `D:\msys64\usr\bin` 之前。

---

## 4. 設定 `cargo config.toml`

### 4.1 設定檔位置

```
C:\Users\你的使用者名稱\.cargo\config.toml
```

若檔案不存在，請手動建立。

### 4.2 完整內容

```toml
[target.x86_64-pc-windows-gnu]
linker = "D:\\msys64\\mingw64\\bin\\gcc.exe"
ar     = "D:\\msys64\\mingw64\\bin\\ar.exe"
runner = "cmd.exe /c"

[env]
CC_x86_64_pc_windows_gnu  = "D:\\msys64\\mingw64\\bin\\gcc.exe"
CXX_x86_64_pc_windows_gnu = "D:\\msys64\\mingw64\\bin\\g++.exe"
AR_x86_64_pc_windows_gnu  = "D:\\msys64\\mingw64\\bin\\ar.exe"
RING_PREGENERATE_ASM = "1"
```

### 4.3 各欄位說明

| 欄位                   | 用途                                                |
| ---------------------- | --------------------------------------------------- |
| `linker`               | 告訴 Rust 連結階段使用哪個 gcc                      |
| `ar`                   | 靜態函式庫打包工具路徑                              |
| `runner`               | 執行編譯結果的方式（Windows 原生用 cmd）            |
| `CC_*`                 | C 編譯器路徑（給使用 `cc` crate 的套件）            |
| `CXX_*`                | C++ 編譯器路徑（給使用 `cxx` / `bindgen` 的套件）   |
| `AR_*`                 | ar 工具路徑（給 C/C++ 相關的 build script）         |
| `RING_PREGENERATE_ASM` | 修正 `ring` 密碼學套件在 Windows GNU 路線的編譯問題 |

### 4.4 確認設定

```powershell
cat C:\Users\$env:USERNAME\.cargo\config.toml
```

---

## 5. 設定編譯器環境變數（避免 ring 等套件失敗）

### 5.1 手動設定（單次有效）

```powershell
$env:CC = "gcc"
$env:CXX = "g++"
$env:AR = "ar"
```

### 5.2 永久寫入 PowerShell Profile

```powershell
# 檢查 Profile 路徑
$PROFILE

# 若無檔案則建立，並用記事本開啟
New-Item -Path $PROFILE -ItemType File -Force
notepad $PROFILE
```

在記事本中加入：

```powershell
$env:CC = "gcc"
$env:CXX = "g++"
$env:AR = "ar"
```

儲存後重新載入 Profile：

```powershell
. $PROFILE
```

---

## 6. 編譯驗證（以 ring 為測試案例）

建立測試專案：

```powershell
cargo new test-rust
cd test-rust
```

編輯 `Cargo.toml`，加入：

```toml
[dependencies]
ring = "0.17.14"
```

執行編譯：

```powershell
cargo clean
cargo build
```

成功時最後幾行應顯示：

```
   Compiling your-project vX.X.X (D:\your-project)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in X.XXs
```

若編譯成功，表示環境已完全就緒。

---

## 7. 現場建構注意事項（客戶端執行前必讀）

### ✅ 必備網路連線（首次建構需要）

- MSYS2 套件下載（pacman）
- 專案依賴下載（crates.io）

### ✅ 離線建構準備（若客戶端無法連外網）

在本機預先下載所有依賴：

```powershell
cargo vendor
```

將 `vendor/` 目錄與專案一同交付，並在客戶端設定：

```toml
# .cargo/config.toml
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "vendor"
```

---

## 8. 常見問題排查

| 錯誤訊息 / 症狀                                  | 原因                                                        | 解決方式                                                                |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `error: linker 'gcc' not found`                  | `D:\msys64\mingw64\bin` 未加入系統 Path，或終端機未重新開啟 | 確認 Path 路徑正確，完全關閉並重新開啟終端機，執行 `where gcc` 確認     |
| `linker 'link.exe' not found`                    | `config.toml` 未正確設定                                    | 確認 `~/.cargo/config.toml` linker 指向 `D:\msys64\mingw64\bin\gcc.exe` |
| `could not find native static library 'pthread'` | MinGW64 工具鏈安裝不完整                                    | 在 MINGW64 視窗重新執行 `pacman -S mingw-w64-x86_64-toolchain`          |
| `where dlltool` 找不到但 MSYS2 有安裝            | Path 設定了 `usr\bin` 而非 `mingw64\bin`                    | 確認 Path 中是 `mingw64\bin`                                            |
| `Compiler family detection failed`               | 缺少 CC 環境變數                                            | 設定 `$env:CC="gcc"` 並加入 PowerShell Profile                          |
| `cargo build` 出現 `undefined reference`         | GNU 工具鏈版本過舊或套件未安裝                              | 在 MINGW64 視窗執行 `pacman -Syu` 更新所有套件                          |

---

## 9. 附錄：工具角色與常用指令速查

### 各工具角色

| 工具          | 來源          | 用途                                |
| ------------- | ------------- | ----------------------------------- |
| `rustc`       | MSYS2 MinGW64 | Rust 編譯器本體                     |
| `cargo`       | MSYS2 MinGW64 | 專案建置與套件管理                  |
| `MSYS2`       | msys2.org     | 提供 Windows 上的 GNU 工具環境      |
| `gcc` / `ld`  | MSYS2 MinGW64 | C 工具鏈，負責最終連結              |
| `dlltool.exe` | MSYS2 MinGW64 | 處理 Windows DLL 連結，GNU 路線必需 |

### 工具目錄結構

```
D:\msys64\mingw64\bin\
    ├── gcc.exe       ← C 編譯器 / 連結器入口
    ├── g++.exe       ← C++ 編譯器
    ├── ld.exe        ← GNU 連結器
    ├── ar.exe        ← 靜態函式庫打包工具
    ├── dlltool.exe   ← DLL import library 工具
    ├── rustc.exe     ← Rust 編譯器
    └── cargo.exe     ← Rust 套件管理工具
```

### 常用指令

| 用途                    | 指令                                        |
| ----------------------- | ------------------------------------------- |
| 更新 MSYS2 套件         | `pacman -Syu`                               |
| 安裝新套件              | `pacman -S <package>`                       |
| 確認工具路徑來源        | `which rustc` / `which gcc` / `which cargo` |
| 確認 cargo / rustc 版本 | `cargo --version` / `rustc --version`       |
| 清除編譯快取            | `cargo clean`                               |
| 顯示詳細編譯過程        | `cargo build --verbose`                     |
| 預先打包所有依賴        | `cargo vendor`                              |

---

_文件版本：v1.2 ／ 適用平台：Windows 10 / 11 x86_64_
