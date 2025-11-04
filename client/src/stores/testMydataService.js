// 在您的組件中使用 mydataService
import { mydataService } from "../services/mydataService.js";

// 創建新的 Mydata 項目
const newData = {
  formName: "申請表範例",
  state: "active",
  contact: {
    name: "張三",
    phone: "02-12345678",
    mobile: "0912345678",
    relationship: "家人",
    otherRelationship: "",
  },
};

const result = await mydataService.createMydata(newData);
if (result.success) {
  console.log("創建成功:", result.data);
}

// 獲取所有 Mydata
const allData = await mydataService.getAllMydata();
if (allData.success) {
  console.log("所有數據:", allData.data);
}

// 根據狀態篩選
const activeData = await mydataService.getMydataByState("active");

// 搜尋
const searchResults = await mydataService.searchMydata("張三");
