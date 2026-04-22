# 備份原檔

```sql
cp your_database.db your_database.backup.db
```

# dump 成 SQL 再重建

````sql
sqlite3 your_database.db .dump > dump.sql
mv your_database.db your_database.old.db
```sql
# 重新匯入（新檔案預設就是 UTF-8）

```sql
sqlite3 db/zk.db < dump.sql
````

# 驗證編碼

```sql
sqlite3 db/zk.db "PRAGMA encoding;"
```

# 確認兩表筆數

```sql
sqlite3 db/zk.db "SELECT COUNT(*) FROM participationRecordDB;"
sqlite3 db/zk.db "SELECT COUNT(*) FROM joinRecordDB;"
```

# 查看表有哪些欄位

sqlite3 zk.db "PRAGMA table_info(joinRecordDB);"

# 匯出 old_table

```sql
sqlite3 db/zk.db ".dump participationRecordDB" > db/old_table_dump.sql
```

# 執行匯入

```sql
sqlite3 db/zk.db < new_table_import.sql
```
