const express = require("express");
const path = require("path");

const app = express();

// 1. 設定靜態資料夾
app.use(express.static(path.join(__dirname, "dist")));

// 2. 處理 Vue Router (history mode 很重要)
// 使用正则表达式匹配所有路由
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = 80;
app.listen(PORT, () => {
  console.log(`Server running zk-client app on http://127.0.0.1:${PORT}`);
});
