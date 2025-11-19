# 執行docker compose
## 配置docker-compose.yml
docker compose up -d

## 前景執行還是背景執行
docker-compose up (前景模式)開發時 (推薦不加 -d)
特點:

容器在前景執行,終端機會被佔用
即時顯示所有容器的 log,方便開發時查看
按 Ctrl+C 會停止並關閉容器
關閉終端機視窗 = 容器停止

適合場景:

開發時需要即時看 log
測試和除錯
想隨時停止容器

docker-compose up -d (背景模式/Detached)
特點:

容器在背景執行,終端機立即釋放
不顯示 log,終端機可以繼續使用
關閉終端機視窗 = 容器繼續運行
需要手動停止: docker-compose down

適合場景:

長期運行服務
不需要一直盯著 log
想同時執行其他指令

## 常用指令組合
背景啟動
docker-compose up -d

查看運行狀態
docker-compose ps

查看即時 log
docker-compose logs -f

重啟某個服務
docker-compose restart directus

停止並清理
docker-compose down

停止並清理(包含 volumes)
docker-compose down -v

## 階段
開發階段: 用 docker-compose up (不加 -d)

方便看錯誤
改完就 Ctrl+C 重啟

部署/測試環境: 用 docker-compose up -d

背景運行
需要時再看 log

簡單記: -d = detach = 分離 = 背景執行 🚀