import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// 获取 __dirname 的替代方法
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5174;

// 1. 設定靜態資料夾
app.use(express.static(path.join(__dirname, "dist")));

// 2. 處理 Vue Router (history mode 很重要)
// 使用正则表达式匹配所有路由
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running zk-client on http://localhost:${PORT}`);
});
