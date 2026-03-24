#!/usr/bin/env node

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 8080;

// 讀取命令列參數
const args = process.argv.slice(2);
const isProd = args.includes("--prod");

// 根據環境設定 host
const HOST = isProd ? "34.81.85.198" : "localhost";

// 設置靜態文件服務 - 服務根目錄的文件
app.use(express.static(path.join(__dirname)));

// 主頁路由 - 動態注入環境變數
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error("讀取 index.html 失敗:", err);
      return res.status(500).send("服務器錯誤");
    }

    // 注入環境變數到 HTML
    const injectedHtml = data.replace(
      "</head>",
      `<script>
        // 環境配置 - 由服務器注入
        window.__ENV__ = {
          isProd: ${isProd},
          host: '${HOST}',
          mode: '${isProd ? "production" : "development"}'
        };
      </script>\n</head>`,
    );

    res.send(injectedHtml);
  });
});

// 健康檢查端點
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Apps Portal",
    port: PORT,
    host: HOST,
    environment: isProd ? "production" : "development",
    uptime: process.uptime(),
  });
});

// 獲取當前環境配置的 API
app.get("/api/env", (req, res) => {
  res.json({
    isProd: isProd,
    host: HOST,
    mode: isProd ? "production" : "development",
    timestamp: new Date().toISOString(),
  });
});

// 404 處理
app.use((req, res) => {
  const notFoundPath = path.join(__dirname, "404.html");
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head><title>404 - 頁面未找到</title></head>
      <body>
        <h1>404 - 頁面未找到</h1>
        <p>您訪問的頁面不存在。</p>
        <a href="/">返回首頁</a>
      </body>
      </html>
    `);
  }
});

// 啟動服務器
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`🏛️  服務入口頁面已啟動`);
  console.log("=".repeat(60));
  console.log(
    `🌍 環境模式: ${isProd ? "生產環境 (PRODUCTION)" : "開發環境 (DEVELOPMENT)"}`,
  );
  console.log(`🔗 訪問地址: http://${HOST}:${PORT}`);
  console.log(`📁 靜態文件目錄: ${__dirname}`);
  console.log(`📄 主頁文件: index.html`);
  console.log("-".repeat(60));

  // 檢查關鍵文件是否存在
  const indexPath = path.join(
    __dirname,
    isProd ? "index.html" : "index.html?prod=true",
  );
  const notFoundPath = path.join(__dirname, "404.html");

  console.log("🔍 文件檢查:");
  console.log(`  - index.html: ${fs.existsSync(indexPath) ? "✅" : "❌"}`);
  console.log(`  - 404.html: ${fs.existsSync(notFoundPath) ? "✅" : "❌"}`);

  if (fs.existsSync(indexPath)) {
    console.log("✨ 主頁文件已就緒");
  } else {
    console.log("⚠️  警告: index.html 文件不存在");
  }

  console.log("=".repeat(60));
  console.log("\n💡 提示:");
  console.log(`  - 開發環境訪問: http://localhost:${PORT}`);
  console.log(`  - 生產環境訪問: http://${HOST}:${PORT}`);
  console.log(`  - 健康檢查: http://${HOST}:${PORT}/health`);
  console.log(`  - 環境配置: http://${HOST}:${PORT}/api/env`);
  console.log("\n✨ 服務已就緒，按 Ctrl+C 停止服務\n");
});
