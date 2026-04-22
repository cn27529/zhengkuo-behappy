# 備份原檔

cp your_database.db your_database.backup.db

# dump 成 SQL 再重建

sqlite3 your_database.db .dump > dump.sql
mv your_database.db your_database.old.db

# 重新匯入（新檔案預設就是 UTF-8）

sqlite3 your_database_new.db < dump.sql

# 驗證

sqlite3 your_database_new.db "PRAGMA encoding;"

# 查看表有哪些欄位

sqlite3 zk.db "PRAGMA table_info(joinRecordDB);"

# 執行匯入

sqlite3 zk.db < new_table_import.sql
