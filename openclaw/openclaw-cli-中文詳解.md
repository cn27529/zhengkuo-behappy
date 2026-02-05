# OpenClaw CLI 命令詳解 (中文版)

## 概述

OpenClaw 2026.2.2-3 (9c5941b) — 流暢的 bash 語言，溫和的諷刺，以及積極的 tab 補全能量。

## 基本語法

```bash
openclaw [選項] [命令]
```

## 全域選項

| 選項 | 說明 |
|------|------|
| `-V, --version` | 輸出版本號 |
| `--dev` | 開發者模式：在 ~/.openclaw-dev 下隔離狀態，預設閘道端口 19001，並偏移衍生端口（瀏覽器/畫布） |
| `--profile <名稱>` | 使用命名配置檔（在 ~/.openclaw-<名稱> 下隔離 OPENCLAW_STATE_DIR/OPENCLAW_CONFIG_PATH） |
| `--no-color` | 停用 ANSI 顏色 |
| `-h, --help` | 顯示命令說明 |

## 主要命令

### 初始化與設定

#### `setup`
初始化 ~/.openclaw/openclaw.json 和代理工作區

#### `onboard`
互動式精靈，用於設定閘道、工作區和技能

#### `configure`
互動式提示，用於設定憑證、裝置和代理預設值

#### `config`
配置輔助工具（get/set/unset）。不帶子命令執行時會啟動精靈

### 系統管理

#### `doctor`
閘道和頻道的健康檢查 + 快速修復

#### `dashboard`
使用當前令牌開啟控制 UI

#### `reset`
重置本地配置/狀態（保留已安裝的 CLI）

#### `uninstall`
卸載閘道服務 + 本地資料（CLI 保留）

### 訊息與通訊

#### `message`
發送訊息和頻道操作

#### `memory`
記憶體搜尋工具

#### `agent`
透過閘道執行代理回合（使用 --local 進行嵌入式執行）

#### `agents`
管理隔離的代理（工作區 + 認證 + 路由）

### 閘道與服務

#### `gateway`
閘道控制

#### `daemon`
閘道服務（舊版別名）

#### `logs`
閘道日誌

#### `system`
系統事件、心跳和存在狀態

### 配置管理

#### `models`
模型配置

#### `approvals`
執行批准

#### `nodes`
節點命令

#### `devices`
裝置配對 + 令牌管理

#### `node`
節點控制

### 開發工具

#### `sandbox`
沙盒工具

#### `tui`
終端 UI

#### `cron`
Cron 排程器

#### `dns`
DNS 輔助工具

#### `docs`
文檔輔助工具

#### `hooks`
Hooks 工具

#### `webhooks`
Webhook 輔助工具

### 連接與配對

#### `pairing`
配對輔助工具

#### `plugins`
外掛管理

#### `channels`
頻道管理

#### `directory`
目錄命令

#### `security`
安全輔助工具

#### `skills`
技能管理

### 維護與更新

#### `update`
CLI 更新輔助工具

#### `completion`
生成 shell 補全腳本

#### `status`
顯示頻道健康狀態和最近的會話接收者

#### `health`
從執行中的閘道獲取健康狀態

#### `sessions`
列出儲存的對話會話

#### `browser`
管理 OpenClaw 的專用瀏覽器（Chrome/Chromium）

#### `help`
顯示命令說明

## 使用範例

### 頻道登入
```bash
openclaw channels login --verbose
```
連結個人 WhatsApp Web 並顯示 QR 碼 + 連接日誌

### 發送訊息
```bash
openclaw message send --target +15555550123 --message "Hi" --json
```
透過您的 web 會話發送並列印 JSON 結果

### 啟動閘道
```bash
openclaw gateway --port 18789
```
在本地執行 WebSocket 閘道

### 開發模式閘道
```bash
openclaw --dev gateway
```
執行開發閘道（隔離狀態/配置）在 ws://127.0.0.1:19001

### 強制啟動閘道
```bash
openclaw gateway --force
```
終止綁定到預設閘道端口的任何程序，然後啟動它

### 代理對話
```bash
openclaw agent --to +15555550123 --message "Run summary" --deliver
```
使用閘道直接與代理對話；可選擇發送 WhatsApp 回覆

### Telegram 訊息
```bash
openclaw message send --channel telegram --target @mychat --message "Hi"
```
透過您的 Telegram 機器人發送

## 更多資訊

詳細文檔請參考：docs.openclaw.ai/cli

## 注意事項

- 使用 `--dev` 選項可以在開發環境中隔離運行
- 配置檔案位於 `~/.openclaw/` 目錄下
- 支援多種通訊頻道（WhatsApp、Telegram 等）
- 提供完整的代理管理和自動化功能

## 常用工作流程

1. **初始設定**：`openclaw setup` → `openclaw onboard`
2. **配置服務**：`openclaw configure`
3. **健康檢查**：`openclaw doctor`
4. **啟動服務**：`openclaw gateway`
5. **管理頻道**：`openclaw channels login`
6. **發送訊息**：`openclaw message send`

這個 CLI 工具提供了完整的 OpenClaw 平台管理功能，從初始設定到日常操作都有相應的命令支援。