<!-- src/views/TaisuiLamp.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>太歲點燈</h2>
      <p class="subtitle">
        依據流年「天干」、「地支」與「十二生肖」找到適合的祈福燈種
      </p>
    </div>

    <div class="form-content">
      <!-- 年份選擇區域 -->
      <div class="form-section">
        <div class="form-group address-row">
          <!-- <label for="yearInput">
            <h4>西元</h4>
          </label> -->
          <div class="year-buttons">
            <button
              type="button"
              class="btn btn-outline capsule-btn"
              v-for="year in yearRange"
              :key="year"
              :class="['year-btn', { active: selectedYear === year }]"
              @click="selectYear(year)"
            >
              {{ year }}
            </button>
          </div>

          <input
            style="display: none"
            type="number"
            id="yearInput"
            v-model="selectedYear"
            placeholder="請輸入年份,如:2026"
            @input="handleYearChange"
            @keyup.enter="loadTableData"
          />
          <div v-if="tableData" class="year-info" style="display: none">
            {{ tableData.currentYearInfo.tiangan
            }}{{ tableData.currentYearInfo.dizhi }}
            {{ tableData.currentYearInfo.zodiacIcon }}
            {{ tableData.currentYearInfo.zodiac }}年
          </div>
        </div>
      </div>

      <!-- 點燈對照表 -->
      <div v-if="tableData" class="form-section">
        <h3>
          民國{{ selectedYear - 1911 }}年「{{ tableData.currentYearInfo.tiangan
          }}{{ tableData.currentYearInfo.dizhi }}
          {{ tableData.currentYearInfo.zodiacIcon }}
          {{ tableData.currentYearInfo.zodiac }}」，十二生肖點燈對照表
        </h3>
        <div class="table-responsive">
          <table class="dotlamp-table">
            <!-- 表頭：地支 -->
            <thead>
              <tr class="header-row">
                <th class="row-label">地支</th>
                <th
                  v-for="(dizhi, index) in tableData.tableHeader"
                  :key="`dizhi-${index}`"
                  :class="{
                    'highlight-column': tableData.isCurrentYearColumn(index),
                  }"
                >
                  {{ dizhi }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 第一行：生肖 -->
              <tr class="zodiac-row">
                <td class="row-label">生肖</td>
                <td
                  v-for="(zodiac, index) in tableData.zodiacRow"
                  :key="`zodiac-${index}`"
                  :class="{
                    'highlight-column': tableData.isCurrentYearColumn(index),
                  }"
                >
                  <div class="zodiac-cell">
                    <span class="zodiac-icon">{{
                      tableData.getZodiacIcon(zodiac)
                    }}</span>
                    <span class="zodiac-text">{{ zodiac }}</span>
                  </div>
                </td>
              </tr>

              <!-- 第二行：神煞註記 -->
              <tr class="notes-row">
                <td class="row-label">神煞</td>
                <td
                  v-for="(_, index) in tableData.tableHeader"
                  :key="`notes-${index}`"
                  :class="{
                    'highlight-column': tableData.isCurrentYearColumn(index),
                  }"
                >
                  <div class="notes-cell">
                    <span
                      v-for="(note, noteIndex) in tableData.getNotesForColumn(
                        index
                      )"
                      :key="`note-${index}-${noteIndex}`"
                      class="note-tag"
                    >
                      {{ note }}
                    </span>
                  </div>
                </td>
              </tr>

              <!-- 第三行：流年數字 -->
              <tr class="numbers-row">
                <td class="row-label">流年數</td>
                <td
                  v-for="(_, index) in tableData.tableHeader"
                  :key="`numbers-${index}`"
                  :class="{
                    'highlight-column': tableData.isCurrentYearColumn(index),
                  }"
                >
                  <div class="numbers-cell">
                    <span
                      v-for="(
                        number, numIndex
                      ) in tableData.getNumbersForColumn(index)"
                      :key="`number-${index}-${numIndex}`"
                      class="number-tag"
                    >
                      {{ number }}
                    </span>
                  </div>
                </td>
              </tr>

              <!-- 第四行：燈種建議 -->
              <tr class="lamp-row">
                <td class="row-label">燈種</td>
                <td
                  v-for="(_, index) in tableData.tableHeader"
                  :key="`lamp-${index}`"
                  :class="{
                    'highlight-column': tableData.isCurrentYearColumn(index),
                  }"
                >
                  <div class="lamp-cell">
                    <span
                      v-for="(
                        lampName, lampIndex
                      ) in tableData.getLampNamesForColumn(index)"
                      :key="`lamp-${index}-${lampIndex}`"
                      :class="['lamp-tag', tableData.getLampClass(lampName)]"
                    >
                      {{ lampName }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 說明區域 -->
      <div class="form-section" style="background: #f8f9fa; padding: 1.5rem">
        <h3>使用說明</h3>
        <div class="explanation-text">
          <ul>
            <li>
              <strong>太歲燈</strong
              >：適用於值太歲、歲破等重大煞氣，提供強力化解與護佑。
            </li>
            <li>
              <strong>元辰燈</strong
              >：適用於病符、死符、天厄等健康與運勢煞氣，祈求身心安康。
            </li>
            <li>
              <strong>光明燈</strong
              >：適用於白虎、五鬼、喪門等一般煞氣，普遍化解、照亮前程。
            </li>
            <li style="display: none">
              <strong>流年數</strong>：{{ lampInfoByZodiac }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useTaiSuiStore } from "../stores/taisuiStore.js";

const route = useRoute();
const taiSuiStore = useTaiSuiStore();
const currentSystemYear = new Date().getFullYear();
const selectedYear = ref(currentSystemYear);
const tableData = ref(null);
const lampInfoByZodiac = ref(null);

// 計算顯示的年範圍 (前3後12，含今年共15年)
const yearRange = computed(() => {
  const start = currentSystemYear - 3;
  const yearRangeArray = Array.from({ length: 12 }, (_, i) => start + i);
  console.log("年份範圍:", yearRangeArray);
  return yearRangeArray;
});

// 選取年份（直接使用 yearRange 常數進行邊界檢查）
const selectYear = (year) => {
  // 檢查該年份是否存在於目前生成的 10 年範圍數組中
  if (!yearRange.value.includes(year)) {
    console.warn(`年份 ${year} 不在顯示範圍內，已攔截動作。`);
    return;
  }

  selectedYear.value = year;
  loadTableData();
};

// // 加载表格数据
// const loadTableData = async () => {
//   try {
//     const year = parseInt(selectedYear.value);
//     if (isNaN(year) || year < 1900 || year > 2100) {
//       console.warn("年份超出范围");
//       return;
//     }

//     // 调用 store 方法获取表格数据
//     tableData.value = taiSuiStore.getDotLampTableData(year);
//     console.log("表格数据加载完成:", tableData.value);

//     // 获取所有生肖燈種信息
//     //const allZodiacLampInfo = taiSuiStore.getDotLampTableData(year).getAllZodiacLampInfo();
//     //console.log(`${year}获取所有生肖燈種信息:`, allZodiacLampInfo);
//     const yearInfo = taiSuiStore.currentYearInfo(year);
//     console.log(`${year}获取年份干支信息:`, yearInfo);
//     lampInfoByZodiac.value = taiSuiStore
//       .getDotLampTableData(year)
//       .getLampInfoByZodiac(yearInfo.zodiac);
//     console.log(`${year}获取生肖燈種信息:`, lampInfoByZodiac.value);
//   } catch (error) {
//     console.error("加载表格数据失败:", error);
//   }
// };

// 處理鍵盤事件
const handleKeyDown = (event) => {
  const key = event.key;
  if (["ArrowUp", "ArrowLeft"].includes(key)) {
    event.preventDefault(); // 防止頁面滾動
    selectYear(selectedYear.value - 1);
  } else if (["ArrowDown", "ArrowRight"].includes(key)) {
    event.preventDefault();
    selectYear(selectedYear.value + 1);
  }
};

// 載入數據 (修改原有的 loadTableData)
const loadTableData = async () => {
  try {
    const year = selectedYear.value;
    tableData.value = taiSuiStore.getDotLampTableData(year);

    const yearInfo = taiSuiStore.currentYearInfo(year);
    lampInfoByZodiac.value = taiSuiStore
      .getDotLampTableData(year)
      .getLampInfoByZodiac(yearInfo.zodiac);
  } catch (error) {
    console.error("加載表格數據失敗:", error);
  }
};

// 处理年份变更
const handleYearChange = () => {
  // 防抖处理，避免频繁调用
  clearTimeout(window.yearChangeTimeout);
  window.yearChangeTimeout = setTimeout(() => {
    loadTableData();
  }, 300);
};

// 页面加载时初始化
onMounted(() => {
  // const yearParam = route.query.year;
  // if (yearParam) {
  //   const year = parseInt(yearParam);
  //   if (!isNaN(year) && year >= 1900 && year <= 2100) {
  //     selectedYear.value = year;
  //   }
  // }

  // // 加载初始数据
  // loadTableData();

  // 監聽全域鍵盤事件
  window.addEventListener("keydown", handleKeyDown);

  const yearParam = route.query.year;
  if (yearParam) {
    const year = parseInt(yearParam);
    if (!isNaN(year)) selectedYear.value = year;
  }
  loadTableData();
});

// 組件卸載時移除監聽，避免記憶體洩漏
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.year-buttons button {
  margin-right: 0.5rem;
}

.year-btn {
  padding: 0.6rem 1rem;
  border: 1px solid #d8d8d8;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: 500;
}

.year-btn:hover {
  background: var(--primary-color, #764ba2);
  border-color: var(--primary-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.year-btn.active {
  background: var(--primary-color, #764ba2);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 2px 10px rgba(92, 81, 81, 0.5);
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.form-group.address-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-group.address-row label {
  width: 120px;
  margin-bottom: 0;
}

.form-group.address-row input {
  flex: 1;
  min-width: 200px;
}

.year-info {
  padding: 0.75rem 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  color: #856404;
  font-weight: bold;
  font-size: 1.1rem;
}

.table-responsive {
  overflow-x: auto;
  margin-top: 1rem;
}

.dotlamp-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dotlamp-table th,
.dotlamp-table td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: center;
  min-width: 80px;
}

.dotlamp-table thead th {
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  background: linear-gradient(
    135deg,
    var(--secondary-color) 0%,
    var(--primary-color) 100%
  );
  color: #ffffff;
  font-weight: bold;
  font-size: 1.1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.row-label {
  background: #f8f9fa !important;
  font-weight: bold;
  color: #495057;
  min-width: 100px;
  position: sticky;
  left: 0;
  z-index: 5;
}

.header-row .row-label {
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; */
  background: #e7f3ff;
  color: #495057;
  z-index: 15;
}

/* 高亮列 */
.highlight-column {
  /* background: #ff9e9e !important; */
  background: linear-gradient(135deg, #ff9e9e 0%, #ff6b6b 100%) !important;
  font-weight: bold;
  color: white !important;
}

.zodiac-row td {
  background: #e7f3ff;
}

.zodiac-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.zodiac-icon {
  font-size: 1.8rem;
}

.zodiac-text {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
}

.notes-row td {
  background: #f8f9fa;
}

.notes-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.note-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #6c757d;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.numbers-row td {
  background: #fff;
}

.numbers-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
}

.number-tag {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: #e9ecef;
  color: #495057;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
}

.lamp-row td {
  background: #ffffff;
}

.lamp-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.lamp-tag {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
}

.lamp-taisui {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.lamp-yuanchen {
  background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
}

.lamp-guangming {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: #333 !important;
}

.explanation-text {
  color: #495057;
  line-height: 1.8;
}

.explanation-text ul {
  margin: 0;
  padding-left: 1.5rem;
}

.explanation-text li {
  margin-bottom: 0.75rem;
}

.explanation-text strong {
  color: #333;
  font-weight: 600;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .form-group.address-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group.address-row label {
    width: auto;
  }

  .dotlamp-table th,
  .dotlamp-table td {
    min-width: 60px;
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  .zodiac-icon {
    font-size: 1.5rem;
  }

  .note-tag,
  .number-tag {
    font-size: 0.65rem;
    padding: 0.2rem 0.3rem;
  }

  .lamp-tag {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
  }
}
</style>
