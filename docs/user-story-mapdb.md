# user story

應用程序啟動時使用指定的資料庫的使用情境是這樣的:
目前`directus`的資料庫連接位置在 server/.env，`rust-axum` 的資料庫連接位置在 rust-axum/.env，`sqlite`資料庫實體位置在 db/data.db，比如客戶A叫做"少林寺"用：db/dbA.db 客戶B叫做"紫雲寺"用：db/dbB.db，目前有什麼說法可以利用json檔設定目前應用程序啟動時指定連接不同資料庫檔案辦的到嗎，先聽聽你的說法，我附上env的檔案 `for-directus.env` `for-rustaxum.env` 及應用程序 app-tree.txt 樹目錄。
