#!/usr/bin/env node

// mongoDBLogger.js - MongoDB 日誌接收服務器
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { DateUtils } from "./utils/dateUtils.js";

// 載入環境變數
dotenv.config();

const app = express();
// const PORT = process.env.MONGO_LOGGER_PORT; // 本地MongoDB服務器端口
// const MONGODB_URI = process.env.MONGODB_URI;
// const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
// const MONGO_COLLECTION = process.env.MONGO_COLLECTION;
// const MONGO_PROJECT_ID = process.env.MONGO_PROJECT_ID;

const username = encodeURIComponent("dbo");
const password = encodeURIComponent("1q2w3e");

// MongoDB 配置
const MONGO_CONFIG = {
  port: process.env.MONGO_LOGGER_PORT, // 本地MongoDB服務器端口
  uri:
    process.env.MONGODB_URI ||
    `mongodb+srv://${username}:${password}@cluster0.z2em3hn.mongodb.net/?appName=Cluster0`,
  dbName: process.env.MONGO_DB_NAME,
  collectionName: process.env.MONGO_COLLECTION,
  projectId: process.env.MONGO_PROJECT_ID,
};

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5173";

let mongoClient = null;
let collection = null;

const corsOptions = {
  origin: FRONTEND_URL, // 明确指定你的前端源
  credentials: true, // 允许接收和发送凭据（如cookies）
  optionsSuccessStatus: 200, // 对于某些老式浏览器
};

// 中間件
//app.use(cors());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// 連接 MongoDB
async function connectMongoDB() {
  try {
    console.log("🔌 正在連接遠程 MongoDB...");
    mongoClient = new MongoClient(MONGO_CONFIG.uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await mongoClient.connect();
    const db = mongoClient.db(MONGO_CONFIG.dbName);
    collection = db.collection(MONGO_CONFIG.collectionName);

    console.log(
      `📚 遠程 MongoDB 資料庫:${db.databaseName}, 集合:${collection.collectionName}`,
    );

    // 建立索引
    await createIndexes();

    console.log("✅ 遠程 MongoDB 連接成功！");
    return true;
  } catch (error) {
    console.error("❌ 遠程 MongoDB 連接失敗:", error.message);
    return false;
  }
}

// 建立索引
async function createIndexes() {
  try {
    await collection.createIndex({ timestamp: -1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ endpoint: 1 });
    await collection.createIndex({ success: 1 });
    await collection.createIndex({ uploadedAt: -1 });
    console.log("📊 索引建立成功");
  } catch (error) {
    console.warn("⚠️ 索引建立失敗:", error.message);
  }
}

// 清理日誌資料
function cleanLogData(log) {
  const cleaned = { ...log };

  // 移除過大的欄位以節省空間
  if (
    cleaned.responseData &&
    JSON.stringify(cleaned.responseData).length > 10000
  ) {
    cleaned.responseData = "[Data too large]";
  }

  if (
    cleaned.requestBody &&
    JSON.stringify(cleaned.requestBody).length > 10000
  ) {
    cleaned.requestBody = "[Data too large]";
  }

  return cleaned;
}

// 靜態頁面路由

// 根路由 - 主頁面
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// MongoDB 日誌服務說明頁面
app.get("/mongo/", (req, res) => {
  res.sendFile("mongo.html", { root: "public" });
});

// API 路由

// 健康檢查
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoClient ? "connected" : "disconnected",
    timestamp: DateUtils.getCurrentISOTime(),
  });
});

// 接收單筆日誌
app.post("/mongo/logentry/", async (req, res) => {
  try {
    if (!collection) {
      return res.status(503).json({
        success: false,
        message: "MongoDB 未連接",
      });
    }

    // 本地調用遠程日誌資料請求，準備儲存日誌
    console.log("本地調用遠程日誌資料請求，準備儲存日誌...");
    const logEntry = req.body;

    // 準備資料
    const preparedLog = {
      ...cleanLogData(logEntry),
      uploadedAt: new Date(),
      source: "web-client",
      projectId: MONGO_CONFIG.projectId,
      serverReceivedAt: DateUtils.getCurrentISOTime(),
    };

    // 插入資料
    const result = await collection.insertOne(preparedLog);

    console.log(
      `📝 收到日誌: ${logEntry.method || "GET"} ${logEntry.endpoint || "unknown"} - ${logEntry.status || "unknown"}`,
    );

    res.json({
      success: true,
      id: result.insertedId,
      message: "日誌已儲存",
    });
  } catch (error) {
    console.error("❌ 儲存日誌失敗:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 批次接收日誌
app.post("/mongo/logentry/batch", async (req, res) => {
  try {
    if (!collection) {
      return res.status(503).json({
        success: false,
        message: "MongoDB 未連接",
      });
    }

    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "無效的日誌資料",
      });
    }

    // 準備資料
    const preparedLogs = logs.map((log) => ({
      ...cleanLogData(log),
      uploadedAt: new Date(),
      source: "web-client",
      projectId: MONGO_CONFIG.projectId,
      serverReceivedAt: DateUtils.getCurrentISOTime(),
    }));

    // 批次插入
    const result = await collection.insertMany(preparedLogs, {
      ordered: false, // 允許部分失敗
    });

    console.log(`📦 批次收到 ${result.insertedCount} 筆日誌`);

    res.json({
      success: true,
      count: result.insertedCount,
      message: `成功儲存 ${result.insertedCount} 筆日誌`,
    });
  } catch (error) {
    console.error("❌ 批次儲存失敗:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 查詢日誌
app.get("/mongo/logentry/", async (req, res) => {
  try {
    if (!collection) {
      return res.status(503).json({
        success: false,
        message: "MongoDB 未連接",
      });
    }

    const {
      endpoint,
      method,
      status,
      success,
      dateFrom,
      dateTo,
      limit = 100,
      skip = 0,
    } = req.query;

    // 建立查詢條件
    const query = {};

    if (endpoint) query.endpoint = { $regex: endpoint, $options: "i" };
    if (method) query.method = method;
    if (status) query.status = parseInt(status);
    if (success !== undefined) query.success = success === "true";

    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom).toISOString();
      if (dateTo) query.timestamp.$lte = new Date(dateTo).toISOString();
    }

    // 查詢資料
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      query: query,
    });
  } catch (error) {
    console.error("❌ 查詢失敗:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 統計資料
app.get("/mongo/stats", async (req, res) => {
  try {
    if (!collection) {
      return res.status(503).json({
        success: false,
        message: "MongoDB 未連接",
      });
    }

    const [total, errors, last24h] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ success: false }),
      collection.countDocuments({
        uploadedAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        total,
        errors,
        last24h,
        errorRate: total > 0 ? ((errors / total) * 100).toFixed(2) + "%" : "0%",
      },
    });
  } catch (error) {
    console.error("❌ 統計失敗:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 清理舊日誌
app.delete("/mongo/cleanup/:days", async (req, res) => {
  try {
    if (!collection) {
      return res.status(503).json({
        success: false,
        message: "MongoDB 未連接",
      });
    }

    const daysToKeep = parseInt(req.params.days) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await collection.deleteMany({
      uploadedAt: { $lt: cutoffDate },
    });

    console.log(`🗑️ 清理了 ${result.deletedCount} 筆舊日誌 (>${daysToKeep}天)`);

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `已清理 ${result.deletedCount} 筆舊日誌`,
    });
  } catch (error) {
    console.error("❌ 清理失敗:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 錯誤處理
app.use((error, req, res, next) => {
  console.error("💥 服務器錯誤:", error);
  res.status(500).json({
    success: false,
    message: "內部服務器錯誤",
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "找不到請求的資源",
  });
});

// 優雅關閉
process.on("SIGINT", async () => {
  console.log("\n🛑 正在關閉服務器...");

  if (mongoClient) {
    await mongoClient.close();
    console.log("👋 MongoDB 連接已關閉");
  }

  process.exit(0);
});

// 啟動服務器
async function startServer() {
  console.log("🚀 啟動 MongoDB 日誌服務器...");
  console.log("📋 配置:");
  console.log(`   - 端口: ${MONGO_CONFIG.port}`);
  console.log(`   - 資料庫: ${MONGO_CONFIG.dbName}`);
  console.log(`   - 集合: ${MONGO_CONFIG.collectionName}`);

  // 連接 MongoDB
  const connected = await connectMongoDB();
  if (!connected) {
    console.error("❌ 無法連接遠程 MongoDB 服務器將繼續運行但無法儲存日誌");
  } else {
    console.log("✅ 已連接到遠程 MongoDB 準備接收日誌");
    console.log("connectMongoDB:", connected);
  }

  // 啟動 HTTP 服務器
  app.listen(MONGO_CONFIG.port, () => {
    console.log(
      `✅ 本地 MongoDB 日誌服務器已啟動: http://127.0.0.1:${MONGO_CONFIG.port}`,
    );
    console.log("📚 系統端點:");
    console.log(
      `   📡 日誌接收: http://127.0.0.1:${MONGO_CONFIG.port}/mongo/logentry/`,
    );
    console.log(
      `   📦 批次日誌: http://127.0.0.1:${MONGO_CONFIG.port}/mongo/logentry/batch`,
    );
    console.log(
      `   🔍 查詢日誌: http://127.0.0.1:${MONGO_CONFIG.port}/mongo/logentry/`,
    );
    console.log(
      `   📊 統計資料: http://127.0.0.1:${MONGO_CONFIG.port}/mongo/stats`,
    );
    console.log(
      `   🗑️ 清理日誌: http://127.0.0.1:${MONGO_CONFIG.port}/mongo/cleanup/:days`,
    );
    console.log(`   💚 健康檢查: http://127.0.0.1:${MONGO_CONFIG.port}/health`);
  });

  // 啟動定時清理任務
  startCleanupJob();
}

// 啟動
startServer().catch((error) => {
  console.error("💥 啟動失敗:", error);
  process.exit(1);
});

/**
 * 啟動定時清理任務（改進版）
 * 在 startServer() 函數內，app.listen() 之後添加
 */
function startCleanupJob() {
  const CLEANUP_INTERVAL_DAYS = 7;
  const CLEANUP_RETAIN_DAYS = 90;

  let isCleaning = false; // 防止重複執行

  async function performCleanup() {
    // 🔒 防重入锁
    if (isCleaning) {
      console.log("⚠️ 清理任务正在执行，跳过");
      return;
    }
    isCleaning = true;

    const startTime = Date.now();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_RETAIN_DAYS);

    console.log(`⏰ [${DateUtils.getCurrentISOTime()}] 開始自動清理...`);
    console.log(`   保留時間: 最近 ${CLEANUP_RETAIN_DAYS} 天`);

    if (!collection) {
      console.log("❌ MongoDB 未連接，跳過清理");
      isCleaning = false;
      return;
    }

    try {
      // 🔧 檢查總日誌數量，少於 5 萬筆就不清理
      const totalCount = await collection.countDocuments();
      if (totalCount < 50000) {
        console.log(
          `📊 日誌數量較少 (${totalCount.toLocaleString()} 筆)，跳過清理`,
        );
        return;
      }

      // 🔧 先統計要刪除的數量
      const countToDelete = await collection.countDocuments({
        uploadedAt: { $lt: cutoffDate },
      });

      if (countToDelete === 0) {
        console.log("✅ 沒有需要清理的舊日誌");
        return;
      }

      // 執行刪除
      const result = await collection.deleteMany({
        uploadedAt: { $lt: cutoffDate },
      });

      const duration = Date.now() - startTime;
      const savedSpaceMB = (result.deletedCount * 3) / 1024;
      const remainingCount = await collection.countDocuments();

      // 🔧 詳細的執行日誌
      console.log(`✅ 清理完成！`);
      console.log(`   刪除: ${result.deletedCount.toLocaleString()} 筆`);
      console.log(`   剩餘: ${remainingCount.toLocaleString()} 筆`);
      console.log(`   節省: 約 ${savedSpaceMB.toFixed(2)} MB`);
      console.log(`   耗時: ${duration}ms`);
      console.log(
        `   下次: ${new Date(Date.now() + CLEANUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toLocaleString()}`,
      );
    } catch (error) {
      console.error("❌ 自動清理失敗:", error.message);
    } finally {
      isCleaning = false;
    }
  }

  // 🔧 改進 1: 啟動時立即執行一次
  console.log("🔄 執行初始清理檢查...");
  performCleanup();

  // 🔧 改進 2: 定期執行
  const intervalId = setInterval(
    performCleanup,
    CLEANUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
  );

  console.log(`✅ 已啟用自動清理任務`);
  console.log(`   清理頻率: 每 ${CLEANUP_INTERVAL_DAYS} 天`);
  console.log(`   保留時間: ${CLEANUP_RETAIN_DAYS} 天`);
  console.log(
    `   下次清理: ${new Date(Date.now() + CLEANUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toLocaleString()}`,
  );

  // 🔧 改進 3: 優雅關閉時清除定時器
  process.on("SIGINT", () => {
    clearInterval(intervalId);
  });

  process.on("SIGTERM", () => {
    clearInterval(intervalId);
  });

  return intervalId;
}
