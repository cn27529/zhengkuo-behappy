#!/usr/bin/env node

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 8080;

// ✅ 偵測 --prod 參數
const isProd = process.argv.includes("--prod");
const HOST = isProd ? "34.81.85.198" : "localhost";

console.log(`🌍 環境: ${isProd ? "生產環境 (prod)" : "本地開發 (dev)"}`);
console.log(`🔗 Host: ${HOST}`);

// ✅ 讀取 index.html 並替換 localhost → 生產 IP
app.get("/", (req, res) => {
  console.log("isProd:", isProd);
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
  const result = isProd ? html.replaceAll("localhost", HOST) : html;
  console.log(result);
  res.send(result);
});

// 設置靜態文件服務 - 服務根目錄的文件
app.use(express.static(path.join(__dirname)));

// // 主頁路由 - 直接提供 index.html
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "index.html"));
// });

// 健康檢查端點
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Apps Portal",
    port: PORT,
    uptime: process.uptime(),
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🏛️  服務入口頁面已啟動: http://localhost:${PORT}`);
  console.log(`📁 靜態文件目錄: ${__dirname}`);
  console.log(`📄 主頁文件: index.html`);

  // 檢查關鍵文件是否存在
  const fs = require("fs");
  const appsHtmlPath = path.join(__dirname, "index.html");
  const notFoundHtmlPath = path.join(__dirname, "404.html");

  console.log("🔍 文件檢查:");
  console.log(`  - index.html: ${fs.existsSync(appsHtmlPath) ? "✅" : "❌"}`);
  console.log(`  - 404.html: ${fs.existsSync(notFoundHtmlPath) ? "✅" : "❌"}`);

  if (fs.existsSync(appsHtmlPath) && fs.existsSync(notFoundHtmlPath)) {
    console.log("✨ 所有文件就緒，可以開始使用！");
  } else {
    console.log("⚠️  警告: 部分文件不存在");
  }
});
