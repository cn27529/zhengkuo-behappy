#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DOCS_DIR = __dirname;
const OUTPUT_FILE = path.join(__dirname, "public", "books.json");

// 提取第一個大標題
function extractTitle(content) {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return trimmed.substring(2).trim();
    }
  }
  return "無標題";
}

// 提取概述說明
function extractOverview(content) {
  const lines = content.split("\n");
  let inOverview = false;
  let overview = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === "## 概述說明") {
      inOverview = true;
      continue;
    }
    
    if (inOverview) {
      // 遇到下一個 ## 標題就停止
      if (trimmed.startsWith("## ") && trimmed !== "## 概述說明") {
        break;
      }
      overview.push(line);
    }
  }
  
  return overview.join("\n").trim() || "無概述說明";
}

// 掃描所有 markdown 文件
function scanMarkdownFiles() {
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(DOCS_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");
      const stats = fs.statSync(filePath);
      
      return {
        id: file.replace(".md", ""),
        title: extractTitle(content),
        overview: extractOverview(content),
        filename: file,
        path: `/doc/${file}`,
        modifiedDate: stats.mtime.toISOString(),
        formattedDate: stats.mtime.toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })
    .sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate));

  return { books: files, total: files.length, generatedAt: new Date().toISOString() };
}

// 生成 books.json
function generateBooksJson() {
  try {
    const data = scanMarkdownFiles();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log(`✅ 已生成 books.json (${data.total} 個文檔)`);
    console.log(`📁 輸出位置: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("❌ 生成失敗:", error);
    process.exit(1);
  }
}

generateBooksJson();
