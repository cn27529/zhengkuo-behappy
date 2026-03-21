#!/usr/bin/env node

const express = require("express");
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const app = express();
const PORT = 3001;
const DOCS_DIR = path.join(__dirname, ".");

// 靜態文件服務
app.use("/static", express.static(path.join(__dirname, "public")));

// 首頁
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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
    const template = fs.readFileSync(
      path.join(__dirname, "public", "document.html"),
      "utf8",
    );

    const html = template
      .replace(/\{\{filename\}\}/g, filename)
      .replace(/\{\{content\}\}/g, htmlContent);

    res.send(html);
  } catch (err) {
    console.error("讀取文檔失敗:", err);
    res.status(500).send("讀取文檔失敗");
  }
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`📚 文檔服務器: http://0.0.0.0:${PORT}`);
  console.log(`📁 文檔目錄: ${DOCS_DIR}`);
});
