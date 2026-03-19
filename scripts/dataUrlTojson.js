// dataUrlTojson.js
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// 定義 API 端點與對應的檔案名稱
const dataJsonObj = [
  {
    dataUrl: "http://localhost:3000/api/activities?fields=*",
    fileName: "mock_activities.json",
  },
  {
    dataUrl: "http://localhost:3000/api/monthly-donates?fields=*",
    fileName: "mock_monthlyDonates.json",
  },
  {
    dataUrl: "http://localhost:3000/api/participation-records?fields=*",
    fileName: "mock_participation_records.json",
  },
  {
    dataUrl: "http://localhost:3000/api/registrations?fields=*",
    fileName: "mock_registrations.json",
  },
  {
    dataUrl: "http://localhost:3000/api/directus-users?fields=*",
    fileName: "mock_directus_users.json",
  },
  {
    dataUrl: "http://localhost:3000/api/receipt-numbers?fields=*",
    fileName: "mock_receipt_numbers.json",
  },
];

// 儲存檔案的目錄 - 設定在上層目錄
const OUTPUT_DIR = path.join(__dirname, '..', 'mock_data');

/**
 * 發送 HTTP GET 請求獲取資料
 * @param {string} url - 請求的 URL
 * @returns {Promise<Object>} - 回應的資料
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    // 根據 URL 協議選擇對應的模組
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (response) => {
      let data = '';
      
      // 檢查回應狀態碼
      if (response.statusCode !== 200) {
        reject(new Error(`請求失敗，狀態碼：${response.statusCode}`));
        return;
      }
      
      // 接收資料片段
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      // 資料接收完畢
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`解析 JSON 失敗：${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`請求錯誤：${error.message}`));
    });
  });
}

/**
 * 確保輸出目錄存在
 */
async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
    console.log(`使用輸出目錄：${OUTPUT_DIR}`);
  } catch (error) {
    // 目錄不存在，建立它
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`建立輸出目錄：${OUTPUT_DIR}`);
  }
}

/**
 * 檢查檔案是否存在
 * @param {string} filePath - 檔案路徑
 * @returns {Promise<boolean>} - 是否存在
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 將資料寫入檔案（存在則覆寫）
 * @param {string} fileName - 檔案名稱
 * @param {any} data - 要寫入的資料
 */
async function writeToFile(fileName, data) {
  const filePath = path.join(OUTPUT_DIR, fileName);
  
  try {
    // 檢查檔案是否已存在
    const exists = await fileExists(filePath);
    
    // 將資料轉換為格式化的 JSON 字串
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf8');
    
    // 根據檔案是否已存在顯示不同的訊息
    if (exists) {
      console.log(`✓ 已覆寫：${fileName} (${data.length} 筆資料)`);
    } else {
      console.log(`✓ 已儲存：${fileName} (${data.length} 筆資料)`);
    }
  } catch (error) {
    console.error(`✗ 儲存失敗 ${fileName}：${error.message}`);
    throw error;
  }
}

/**
 * 處理單一 API 端點
 * @param {Object} item - 包含 dataUrl 和 fileName 的物件
 */
async function processApiEndpoint(item) {
  const { dataUrl, fileName } = item;
  
  try {
    console.log(`正在獲取：${dataUrl}`);
    
    // 發送請求獲取資料
    const response = await fetchData(dataUrl);
    
    // 檢查回應格式是否符合預期
    if (!response.success) {
      throw new Error(`API 回應失敗：${response.message || '未知錯誤'}`);
    }
    
    // 獲取 data 欄位的內容
    const dataContent = response.data || [];
    
    // 儲存到檔案（存在則覆寫）
    await writeToFile(fileName, dataContent);
    
    return { success: true, fileName, dataLength: dataContent.length };
  } catch (error) {
    console.error(`✗ 處理失敗 ${dataUrl}：${error.message}`);
    return { success: false, fileName, error: error.message };
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('=== 開始從 API 獲取資料並轉換為 JSON 檔案 ===\n');
  console.log(`當前執行目錄：${__dirname}`);
  console.log(`上層目錄：${path.join(__dirname, '..')}`);
  console.log(`輸出目錄：${OUTPUT_DIR}\n`);
  
  // 確保輸出目錄存在
  await ensureOutputDir();
  
  // 統計結果
  const results = {
    total: dataJsonObj.length,
    success: 0,
    failed: 0
  };
  
  // 依序處理每個 API 端點
  for (const item of dataJsonObj) {
    const result = await processApiEndpoint(item);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    console.log('---');
  }
  
  // 輸出總結
  console.log('\n=== 處理完成 ===');
  console.log(`總計：${results.total} 個端點`);
  console.log(`成功：${results.success} 個`);
  console.log(`失敗：${results.failed} 個`);
  console.log(`檔案儲存位置：${OUTPUT_DIR}`);
  
  // 顯示目錄結構
  console.log('\n📁 目錄結構：');
  console.log(`  ${path.join(__dirname, '..')}/ (上層目錄)`);
  console.log(`  └── mock_data/`);
  dataJsonObj.forEach(item => {
    console.log(`      └── ${item.fileName}`);
  });
  
  // 提示覆寫完成
  console.log('\n📝 注意：所有已存在的檔案都已被覆寫為最新資料');
}

// 執行程式
main().catch(error => {
  console.error('程式執行失敗：', error);
  process.exit(1);
});