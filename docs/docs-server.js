#!/usr/bin/env node

const express = require("express");
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

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
  const files = getMarkdownFiles();

  const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>專案文檔</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
        .file-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 20px; }
        .file-item { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; transition: all 0.2s; }
        .file-item:hover { background: #e3f2fd; border-color: #007acc; transform: translateY(-2px); }
        .file-item a { text-decoration: none; color: #007acc; font-weight: 500; }
        .file-item a:hover { color: #0056b3; }
        .file-name { font-size: 14px; color: #666; margin-top: 5px; }
        .file-date { font-size: 12px; color: #999; margin-top: 3px; }
        .file-description { font-size: 13px; color: #777; margin-top: 8px; line-height: 1.4; }
        .stats { background: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 專案文檔</h1>
        <div class="stats">
            <strong>共 ${files.length} 個文檔</strong>
        </div>
        <div class="file-list">
            ${files
              .map(
                (file) => `
                <div class="file-item">
                    <a href="/doc/${encodeURIComponent(file.path)}">${file.title}</a>
                    <div class="file-name">${file.name}</div>
                    <div class="file-date">📅 ${file.formattedDate}</div>
                    <div class="file-description">${file.description}</div>
                </div>
            `,
              )
              .join("")}
        </div>
    </div>
</body>
</html>`;

  res.send(html);
});

// 查看單個文檔
app.get("/doc/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(DOCS_DIR, filename);

  if (!fs.existsSync(filePath) || !filename.endsWith(".md")) {
    return res.status(404).send("文檔不存在");
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const htmlContent = marked(content);

    const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename} - 專案文檔</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 25px; }
        .back-link { color: #007acc; text-decoration: none; font-size: 14px; }
        .back-link:hover { text-decoration: underline; }
        .doc-title { color: #333; margin: 10px 0 0 0; }
        .content h1, .content h2, .content h3 { color: #333; }
        .content h1 { border-bottom: 2px solid #007acc; padding-bottom: 8px; }
        .content h2 { border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .content pre { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; overflow-x: auto; }
        .content code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
        .content pre code { background: none; padding: 0; }
        .content blockquote { border-left: 4px solid #007acc; margin: 0; padding-left: 15px; color: #666; }
        .content table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        .content th, .content td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        .content th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← 返回文檔列表</a>
            <h1 class="doc-title">${filename}</h1>
        </div>
        <div class="content">
            ${htmlContent}
        </div>
    </div>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error("讀取文檔失敗:", err);
    res.status(500).send("讀取文檔失敗");
  }
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`📚 文檔服務器已啟動: http://localhost:${PORT}`);
  console.log(`📁 文檔目錄: ${DOCS_DIR}`);
});
