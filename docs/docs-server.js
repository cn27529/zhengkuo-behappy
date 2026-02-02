#!/usr/bin/env node

const express = require("express");
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const { templateEngine } = require("./templates");

const app = express();
const PORT = 3001;
const DOCS_DIR = path.join(__dirname, ".");

// 設置靜態文件服務
app.use("/static", express.static(path.join(__dirname, "public")));

// 提取文檔描述（第一個大標題）
function extractDescription(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      // 找到第一個大標題（# 開頭）
      if (trimmed.startsWith("# ")) {
        return trimmed.substring(2).trim(); // 移除 "# " 前綴
      }
    }
    return "無標題";
  } catch (err) {
    return "無法讀取標題";
  }
}

// 獲取所有 markdown 文件
function getMarkdownFiles() {
  try {
    return fs
      .readdirSync(DOCS_DIR)
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const filePath = path.join(DOCS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          title: file.replace(".md", "").replace(/-/g, " "),
          path: file,
          modifiedDate: stats.mtime,
          formattedDate: stats.mtime.toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          description: extractDescription(filePath),
        };
      })
      .sort((a, b) => b.modifiedDate - a.modifiedDate); // 按修改時間降序排列
  } catch (err) {
    console.error("讀取文檔目錄失敗:", err);
    return [];
  }
}

// 首頁 - 文檔列表
app.get("/", (req, res) => {
  try {
    const html = templateEngine.render("index.html");
    res.send(html);
  } catch (error) {
    console.error("渲染首頁失敗:", error);
    res.status(500).send("頁面載入失敗");
  }
});

// API 端點 - 獲取文檔列表數據
app.get("/api/documents", (req, res) => {
  try {
    const files = getMarkdownFiles();
    res.json({
      success: true,
      files: files,
      count: files.length
    });
  } catch (error) {
    console.error("獲取文檔列表失敗:", error);
    res.status(500).json({
      success: false,
      message: "獲取文檔列表失敗"
    });
  }
});

// API 端點 - 獲取單個文檔的原始內容
app.get("/api/document/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(DOCS_DIR, filename);

  if (!fs.existsSync(filePath) || !filename.endsWith(".md")) {
    return res.status(404).json({
      success: false,
      message: "文檔不存在"
    });
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const stats = fs.statSync(filePath);
    
    res.json({
      success: true,
      data: {
        filename: filename,
        content: content,
        htmlContent: marked(content),
        modifiedDate: stats.mtime,
        size: stats.size
      }
    });
  } catch (error) {
    console.error("讀取文檔失敗:", error);
    res.status(500).json({
      success: false,
      message: "讀取文檔失敗"
    });
  }
});

// API 端點 - 重新載入模板緩存
app.post("/api/reload-templates", (req, res) => {
  try {
    templateEngine.clearCache();
    res.json({
      success: true,
      message: "模板緩存已清除"
    });
  } catch (error) {
    console.error("清除模板緩存失敗:", error);
    res.status(500).json({
      success: false,
      message: "清除模板緩存失敗"
    });
  }
});

// 查看單個文檔 - 必須在 404 處理之前定義
app.get("/doc/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(DOCS_DIR, filename);

  if (!fs.existsSync(filePath) || !filename.endsWith(".md")) {
    return res.status(404).send("文檔不存在");
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const htmlContent = marked(content);

    const html = templateEngine.render("document.html", {
      filename: filename,
      content: htmlContent
    });

    if (html.includes("模板載入失敗")) {
      return res.status(500).send("模板載入失敗");
    }

    res.send(html);
  } catch (err) {
    console.error("❌ 讀取文檔失敗:", err);
    res.status(500).send("讀取文檔失敗");
  }
});

// 健康檢查端點
app.get("/health", (req, res) => {
  const files = getMarkdownFiles();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    docs: {
      count: files.length,
      directory: DOCS_DIR
    },
    server: {
      port: PORT,
      uptime: process.uptime()
    }
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error("💥 服務器錯誤:", error);
  res.status(500).json({
    success: false,
    message: "內部服務器錯誤"
  });
});

// 404 處理 - 必須在所有路由之後定義
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>頁面不存在 - 專案文檔</title>
        <link rel="stylesheet" href="/static/styles.css">
    </head>
    <body>
        <div class="container">
            <h1>🔍 頁面不存在</h1>
            <p>抱歉，您訪問的頁面不存在。</p>
            <a href="/" class="back-link">← 返回首頁</a>
        </div>
    </body>
    </html>
  `);
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`📚 文檔服務器已啟動: http://localhost:${PORT}`);
  console.log(`📁 文檔目錄: ${DOCS_DIR}`);
  console.log(`🎨 模板目錄: ${path.join(__dirname, "public")}`);
  
  // 檢查關鍵文件是否存在
  const templatePath = path.join(__dirname, "public", "document.html");
  const stylesPath = path.join(__dirname, "public", "styles.css");
  
  console.log("🔍 關鍵文件檢查:");
  console.log(`  - document.html: ${fs.existsSync(templatePath) ? "✅" : "❌"}`);
  console.log(`  - styles.css: ${fs.existsSync(stylesPath) ? "✅" : "❌"}`);
  
  // 列出一些文檔文件
  const files = getMarkdownFiles();
  console.log(`📄 找到 ${files.length} 個文檔文件`);
  if (files.length > 0) {
    console.log("  前幾個文檔:");
    files.slice(0, 3).forEach(file => {
      console.log(`    - ${file.name}`);
    });
  }
});
