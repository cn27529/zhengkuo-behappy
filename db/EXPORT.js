const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "EXPORT.csv");
const outPath = path.join(__dirname, "EXPORT.json");

const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
// 第一行為標題列，略過不處理
const headers = lines[0].split(",");

// 解析單行 CSV，處理欄位內含逗號（引號包覆）的情況
function parseRow(line) {
  const result = [];
  let cur = "",
    inQuote = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// 依「通訊地址」欄位值決定取哪組地址：
//   "連絡地址" → 郵遞區號2(15) + 連絡地址(16)
//   "戶籍地址" → 郵遞區號1(13) + 戶籍地址(14)
function getAddress(row) {
  //「通訊地址」連絡地址寫填不實，先以「連絡地址」為主，若無再看「戶籍地址」
  const type = row[12];
  if (type === "連絡地址")
    return ((row[15] || row[13]) + " " + (row[16] || row[14])).trim();
  //「通訊地址」戶籍地址寫填不實，先以「戶籍地址」為主，若無再看「連絡地址」
  if (type === "戶籍地址")
    return ((row[13] || row[15]) + " " + (row[14] || row[16])).trim();
  return "";
}

const results = [];
let id = 1;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const row = parseRow(line);
  const category = row[22]; // 類別：消災 / 點燈 / 超渡 / 超度
  //if (!category) continue;  // 類別空白略過

  // --- 共用欄位 ---
  const formId = row[0]; // 蓮友編號(電話)
  const name = row[1]; // 姓名
  const zodiac = row[7]; // 生肖
  const mobile = row[8]; // 行動電話
  const phone = row[9]; // 電話1
  const contactName = row[18]; // 連絡人
  const notes = row[19]; // 備註
  const formName = row[20]; // 異動人員（無專屬欄位，借用 formName）
  const updatedAt = row[21] ? new Date(row[21]).toISOString() : "";
  const relationship = row[23]; // 關係：直接填入 CSV 原始值
  const address = getAddress(row);
  const createdAt = new Date("2026-05-17T14:00:00.000Z").toISOString();

  const contact = {
    name: contactName,
    phone,
    mobile,
    relationship,
    otherRelationship: "",
  };

  let record;

  if (
    category === "消災" ||
    category === "點燈" ||
    category === "會員" ||
    category === "其它" ||
    category === "確定不需要法訊" ||
    category === "劃撥" ||
    category === "立牌" ||
    category === "索取" ||
    category === "朋友"
  ) {
    // 消災 / 點燈：人員填入 blessing，salvation 留空
    record = {
      id: id++,
      formId,
      formName,
      formSource: "EXPORT.csv",
      state: "EXPORT",
      createdAt,
      updatedAt,
      notes: notes || category || "",
      contact,
      blessing: {
        address,
        persons: [{ id: 1, name, zodiac, notes: "", isHouseholdHead: true }],
      },
      salvation: { address: "", ancestors: [], survivors: [] },
    };
  } else if (category === "超度" || category === "超渡" || category === "") {
    // 超渡：姓名第一字為往生者姓氏（ancestors），本人為陽上人（survivors）
    record = {
      id: id++,
      formId,
      formName,
      formSource: "EXPORT.csv",
      state: "EXPORT",
      createdAt,
      updatedAt,
      notes: notes || category || "",
      contact,
      blessing: { address: "", persons: [] },
      salvation: {
        address,
        ancestors: [
          {
            id: 1,
            surname: name.length <= 4 ? name.charAt(0) : "",
            notes: name,
          },
        ],
        survivors: [{ id: 2, name, zodiac, notes: "" }],
      },
    };
  } else {
    console.warn(
      `Line ${i + 1}: 未知類別 "${category}"，略過。csv row: ${line}`,
    );
    continue; // 未知類別略過
  }

  results.push(record);
}

// 先刪除舊的 EXPORT.json，確保每次重新生成
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
console.log(`Done: ${results.length} records → EXPORT.json`);
