// scripts/testMydata.js
const https = require("https");
const http = require("http");

class DirectusTester {
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const lib = url.protocol === "https:" ? https : http;

      const reqOptions = {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...options.headers,
        },
      };

      const req = lib.request(url, reqOptions, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({
              status: response.statusCode,
              data: parsed,
            });
          } catch (error) {
            reject(new Error(`JSON 解析錯誤: ${error.message}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async testConnection() {
    console.log("🔗 測試 Directus 連接...");
    try {
      const result = await this.request("/server/info");
      console.log("✅ Directus 連接成功");
      console.log("版本:", result.data.data?.version);
      return true;
    } catch (error) {
      console.log("❌ Directus 連接失敗:", error.message);
      return false;
    }
  }

  async testMydataCollection() {
    console.log("\n📊 測試 Mydata Collection...");
    try {
      const result = await this.request("/items/mydata?fields=*,contact.*");

      if (result.status === 200) {
        console.log("✅ Mydata Collection 訪問成功");
        console.log(`找到 ${result.data.data?.length || 0} 筆記錄`);

        if (result.data.data && result.data.data.length > 0) {
          console.log("\n範例記錄:");
          result.data.data.forEach((item, index) => {
            console.log(`${index + 1}. ${item.formName} (${item.state})`);
            if (item.contact) {
              console.log(`   聯絡人: ${item.contact.name}`);
            }
          });
        }
        return true;
      } else {
        console.log("❌ Mydata Collection 訪問失敗:", result.status);
        return false;
      }
    } catch (error) {
      console.log("❌ Mydata Collection 測試失敗:", error.message);
      return false;
    }
  }

  async createTestData() {
    console.log("\n➕ 創建測試數據...");
    const testData = {
      formName: `CLI測試-${Date.now()}`,
      state: "draft",
      contact: {
        name: "命令行測試用戶",
        phone: "02-87654321",
        mobile: "0987654321",
        relationship: "同事",
        otherRelationship: "",
      },
    };

    try {
      const result = await this.request("/items/mydata", {
        method: "POST",
        body: testData,
      });

      if (result.status === 200) {
        console.log("✅ 測試數據創建成功");
        console.log("ID:", result.data.data.id);
        return true;
      } else {
        console.log("❌ 測試數據創建失敗:", result.status);
        return false;
      }
    } catch (error) {
      console.log("❌ 創建測試數據失敗:", error.message);
      return false;
    }
  }
}

// 主測試函數
async function main() {
  const directusUrl = process.env.DIRECTUS_URL || "http://0.0.0.0:8055";
  const token = process.env.DIRECTUS_TOKEN; // 可選的靜態令牌

  const tester = new DirectusTester(directusUrl, token);

  console.log("🚀 開始 Directus Mydata 測試\n");

  // 測試連接
  const connected = await tester.testConnection();
  if (!connected) {
    console.log("\n💡 提示:");
    console.log("1. 確保 Directus 服務正在運行");
    console.log("2. 檢查 DIRECTUS_URL 環境變量");
    console.log("3. 如果需要認證，設置 DIRECTUS_TOKEN 環境變量");
    return;
  }

  // 測試 Mydata Collection
  await tester.testMydataCollection();

  // 創建測試數據（可選）
  const shouldCreate = process.argv.includes("--create");
  if (shouldCreate) {
    await tester.createTestData();
  }

  console.log("\n🎉 測試完成");
}

// 運行測試
main().catch(console.error);
