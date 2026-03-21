const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 9000;
const DB_PATH = process.env.DB_PATH || "./db/current.db";

app.use(express.json());
app.use(express.static("public"));

// 數據庫連接
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

// 獲取所有表
app.get("/api/tables", (req, res) => {
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    },
  );
});

// 獲取表結構
app.get("/api/schema/:table", (req, res) => {
  db.all(`PRAGMA table_info(${req.params.table})`, (err, rows) => {
    console.log(`獲取 ${req.params.table} 表結構`);
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 查詢表數據
app.get("/api/data/:table", (req, res) => {
  const limit = req.query.limit || 100;
  const offset = req.query.offset || 0;
  db.all(
    `SELECT * FROM ${req.params.table} LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    },
  );
});

// 執行自定義查詢
app.post("/api/query", (req, res) => {
  const { sql } = req.body;
  db.all(sql, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 主頁
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SQLite Database Viewer</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .container { display: flex; gap: 20px; }
        .sidebar { width: 200px; }
        .content { flex: 1; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        button { padding: 5px 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>📊 SQLite Database Viewer</h1>
      <div class="container">
        <div class="sidebar">
          <h3>Tables</h3>
          <div id="tables"></div>
        </div>
        <div class="content">
          <h3>Data</h3>
          <div id="data"></div>
        </div>
      </div>
      <script>
        // 載入表列表
        fetch('/api/tables')
          .then(r => r.json())
          .then(tables => {
            const container = document.getElementById('tables');
            tables.forEach(table => {
              const btn = document.createElement('button');
              btn.textContent = table.name;
              btn.onclick = () => loadTable(table.name);
              container.appendChild(btn);
              container.appendChild(document.createElement('br'));
            });
          });
        
        // 載入表數據
        function loadTable(tableName) {
          fetch(\`/api/data/\${tableName}\`)
            .then(r => r.json())
            .then(rows => {
              if (rows.length === 0) {
                document.getElementById('data').innerHTML = '<p>No data</p>';
                return;
              }
              
              const keys = Object.keys(rows[0]);
              let html = '<table><thead><tr>';
              keys.forEach(key => html += \`<th>\${key}</th>\`);
              html += '</tr></thead><tbody>';
              
              rows.forEach(row => {
                html += '<tr>';
                keys.forEach(key => html += \`<td>\${row[key]}</td>\`);
                html += '</tr>';
              });
              
              html += '</tbody></table>';
              document.getElementById('data').innerHTML = html;
            });
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`數據庫服務器運行在: http://0.0.0.0:${PORT}`);
  console.log(`📊 數據庫文件: ${DB_PATH}`);
});
