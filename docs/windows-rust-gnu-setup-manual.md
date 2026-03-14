# Windows Rust 建構環境設定手冊（MSYS2 + GNU 模式）

## 概述說明

本文檔提供在 Windows 環境下使用 MSYS2 與 GNU 工具鏈建構 Rust 專案的完整設定指南。適用於無法使用 MSVC 或需要 GNU 工具鏈的專案環境，包含 MSYS2 安裝、MinGW-w64 工具鏈配置、Rust GNU 模式設定，以及常見編譯問題的解決方案。

## 適用情境

- 客戶端現場無法使用 MSVC（無 Windows SDK / C 槽空間不足）
- 專案依賴需要 GNU 工具鏈（如 `ring`、`libsqlite3-sys`）
- 希望在 Windows 上建立穩定、可複現的 Rust 編譯環境

---

## 1. 安裝 MSYS2（提供 GNU 工具鏈）

### 1.1 下載並安裝 MSYS2

- 官方下載頁：https://www.msys2.org
- 下載 `msys2-x86_64-xxx.exe`
- 安裝目錄建議：`D:\msys64`（避免佔用 C 槽）

### 1.2 安裝 MinGW-w64 工具鏈

開啟 **MSYS2 MINGW64** 終端機，執行：

```bash
pacman -Syu          # 首次更新（可能會關閉終端）
# 重新開啟 MINGW64 終端機後繼續
pacman -Su           # 完成剩餘更新
pacman -S mingw-w64-x86_64-toolchain  # 安裝 gcc, g++, make, ar 等
```

### 1.3 驗證工具鏈

在 **MSYS2 MINGW64** 中執行：

```bash
gcc --version    # 應顯示 13+ 或 15+
ld --version
ar --version
dlltool --version
make --version
```

確認每個工具都有輸出版本號，並確認路徑為 `/mingw64/bin/` 開頭：

```bash
which gcc
which ld
which ar
which dlltool
```

> ⚠️ 若路徑為 `/usr/bin/` 開頭，表示抓到的是 MSYS 版本而非 MinGW64 版本，請確認開啟的是 **MINGW64** 視窗。

---

## 2. 將 MSYS2 工具加入 Windows PATH（供 PowerShell 使用）

### 2.1 加入系統環境變數

將以下路徑加入 `PATH`（以 `D:\msys64` 為例）：

```
D:\msys64\mingw64\bin
D:\msys64\usr\bin
```

### 2.2 驗證 PATH（在 PowerShell 中測試）

```powershell
gcc --version      # 應顯示版本資訊
make --version     # 應顯示版本資訊
```

同時驗證各工具實際存在：

```powershell
Test-Path "D:\msys64\mingw64\bin\gcc.exe"
Test-Path "D:\msys64\mingw64\bin\ar.exe"
Test-Path "D:\msys64\mingw64\bin\g++.exe"
Test-Path "D:\msys64\mingw64\bin\dlltool.exe"
```

四個指令都應回傳 `True`。若出現 `False`，請回到 1.2 重新安裝工具鏈。

> ⚠️ 如果找不到指令，請確認 PATH 設定並**重新開啟** PowerShell。

---

## 3. 安裝 Rust（GNU 模式）

### 3.1 使用 git bash 安裝 rustup

在 git bash 中執行：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 3.2 安裝並切換到 GNU 工具鏈

安裝完成後，在 git bash 中執行：

```bash
rustup toolchain install stable-x86_64-pc-windows-gnu
rustup default stable-x86_64-pc-windows-gnu
```

### 3.3 驗證 Rust 安裝

重新開啟 PowerShell，執行：

```powershell
rustc --version --verbose
rustup toolchain list
```

確認輸出中 `host` 為：

```
x86_64-pc-windows-gnu
```

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
cargo new test-ring
cd test-ring
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

若編譯成功，表示環境已完全就緒。

---

## 7. 現場建構注意事項（客戶端執行前必讀）

### ✅ 必備網路連線（首次建構需要）

- MSYS2 套件下載
- Rust 安裝腳本
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

### ✅ 常見錯誤與解決

| 錯誤訊息                                         | 原因                     | 解決方式                                        |
| ------------------------------------------------ | ------------------------ | ----------------------------------------------- |
| `linker link.exe not found`                      | 誤用 MSVC 工具鏈         | 確認 Rust 為 GNU 模式                           |
| `gcc not found`                                  | PATH 未設定              | 檢查 MSYS2 bin 路徑                             |
| `Compiler family detection failed`               | 缺少 CC 環境變數         | 設定 `$env:CC="gcc"`                            |
| `could not find native static library 'pthread'` | MinGW64 工具鏈安裝不完整 | 重新執行 `pacman -S mingw-w64-x86_64-toolchain` |

---

## 8. 附錄：常用指令速查

| 用途                  | 指令                                          |
| --------------------- | --------------------------------------------- |
| 更新 MSYS2 套件       | `pacman -Syu`                                 |
| 安裝新套件            | `pacman -S <package>`                         |
| 設定 GNU 工具鏈為預設 | `rustup default stable-x86_64-pc-windows-gnu` |
| 列出已安裝工具鏈      | `rustup toolchain list`                       |
| 清除編譯快取          | `cargo clean`                                 |
| 顯示詳細編譯過程      | `cargo build --verbose`                       |
| 預先打包所有依賴      | `cargo vendor`                                |

---

_文件版本：v1.0 ／ 適用平台：Windows 10 / 11 x86_64_
