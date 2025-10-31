<!-- src/views/TaiSui.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>
        {{ taiSuiStore.analysisResult?.year || "加载中..." }}年太歲分析結果
      </h2>
      <div v-if="isLoading" class="loading-indicator">🔄 分析中...</div>
    </div>

    <div class="form-content">
      <!-- 年份输入区域 -->
      <div id="sticky" class="form-section">
        <h2>查詢年份</h2>
        <div class="form-grid">
          <!-- 在模板中修改輸入框 -->
          <div class="form-group address-row">
            <label for="yearInput">輸入年份</label>
            <input
              type="number"
              id="yearInput"
              v-model="taiSuiStore.inputYear"
              placeholder="請輸入年份，如：2025"
              @input="handleYearInput"
              @keyup="handleKeyUp"
              :disabled="isLoading"
            />
            <button
              style="display: none"
              type="button"
              class="btn btn-primary btn-sm"
              @click="analyzeCurrentYear"
              :disabled="isLoading"
            >
              {{ isLoading ? "分析中..." : "查詢" }}
            </button>
          </div>
          <div class="form-group" v-if="taiSuiStore.urlYear">
            <div class="url-info">
              從 URL 參數讀取年份: <strong>{{ taiSuiStore.urlYear }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果显示区域 -->
      <div v-if="taiSuiStore.analysisResult" class="form-section">
        <h2>天干地支基本信息</h2>

        <!-- 天干地支信息 -->
        <div class="form-section" style="background: #f8f9fa; padding: 1.5rem">
          <h3></h3>
          <div class="form-grid">
            <div class="form-group">
              <label>天干</label>
              <div class="result-value">
                {{ taiSuiStore.analysisResult.tiangan }}
              </div>
            </div>
            <div class="form-group">
              <label>地支</label>
              <div class="result-value">
                {{ taiSuiStore.analysisResult.dizhi }}
              </div>
            </div>
            <div class="form-group">
              <label>生肖</label>
              <div class="result-value zodiac-display">
                {{ taiSuiStore.analysisResult.zodiacIcon }}
                {{ taiSuiStore.analysisResult.zodiac }}
              </div>
            </div>
          </div>
        </div>

        <!-- 太歲類型 -->
        <div class="form-section" style="background: #fff3cd; padding: 1.5rem">
          <h3>犯太歲生肖</h3>
          <div class="form-grid compact">
            <div class="form-group">
              <label class="tai-sui-label value">值太歲（本命年）</label>
              <div class="result-value zodiac-display">
                {{
                  taiSuiStore.getZodiacIcon(
                    taiSuiStore.analysisResult.taiSuiTypes.valueTaiSui
                  )
                }}
                {{ taiSuiStore.analysisResult.taiSuiTypes.valueTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label chong">沖太歲</label>
              <div class="result-value zodiac-display">
                {{
                  taiSuiStore.getZodiacIcon(
                    taiSuiStore.analysisResult.taiSuiTypes.chongTaiSui
                  )
                }}
                {{ taiSuiStore.analysisResult.taiSuiTypes.chongTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label hai">害太歲</label>
              <div class="result-value zodiac-display">
                {{
                  taiSuiStore.getZodiacIcon(
                    taiSuiStore.analysisResult.taiSuiTypes.haiTaiSui
                  )
                }}
                {{ taiSuiStore.analysisResult.taiSuiTypes.haiTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label po">破太歲</label>
              <div class="result-value zodiac-display">
                {{
                  taiSuiStore.getZodiacIcon(
                    taiSuiStore.analysisResult.taiSuiTypes.poTaiSui
                  )
                }}
                {{ taiSuiStore.analysisResult.taiSuiTypes.poTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label xing">刑太歲</label>
              <div class="result-value zodiac-display">
                {{
                  taiSuiStore.getZodiacIcon(
                    taiSuiStore.analysisResult.taiSuiTypes.xingTaiSui
                  )
                }}
                {{ taiSuiStore.analysisResult.taiSuiTypes.xingTaiSui }}
              </div>
            </div>
          </div>
        </div>

        <!-- 解釋說明 -->
        <div class="form-section" style="background: #e7f3ff; padding: 1.5rem">
          <h3>民俗解釋與建議</h3>
          <div class="explanation-text">
            <pre>{{ taiSuiStore.analysisResult.explanation }}</pre>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions" style="display: none">
        <button type="button" class="btn btn-secondary" @click="handleReset">
          重置
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="analyzeCurrentYear"
        >
          查詢
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="generateShareLink"
          v-if="taiSuiStore.analysisResult"
        >
          分享連結
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, watch, ref, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaiSuiStore } from "../stores/taisui";

export default {
  name: "TaiSui",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const taiSuiStore = useTaiSuiStore();
    const isLoading = ref(false);

    // 從 URL 參數讀取年份
    const getYearFromURL = () => {
      const yearParam = route.query.year;
      if (yearParam) {
        const year = parseInt(yearParam);
        if (!isNaN(year) && year >= 1900 && year <= 2100) {
          taiSuiStore.setUrlYear(year);
          return year;
        }
      }
      return null;
    };

    // 更新 URL 參數
    const updateURLParameter = (year) => {
      const currentPath = route.path;
      router.push({
        path: currentPath,
        query: { year: year.toString() },
      });
    };

    const analyzeCurrentYear = async (yearToAnalyze = null) => {
      let year = yearToAnalyze;

      if (!year) {
        // 優先使用 URL 參數的年份
        const urlYearValue = getYearFromURL();
        if (urlYearValue) {
          year = urlYearValue;
          taiSuiStore.setInputYear(year);
        } else {
          year = parseInt(taiSuiStore.inputYear);
        }
      }

      if (!year || isNaN(year)) {
        console.warn("無效的年份輸入");
        return;
      }

      if (year < 1900 || year > 2100) {
        console.warn("年份超出範圍");
        return;
      }

      try {
        isLoading.value = true;
        console.log("開始分析年份:", year);
        await taiSuiStore.performAnalysis(year);
        console.log("分析完成，當前結果:", taiSuiStore.analysisResult);
        await nextTick(); // 確保 DOM 更新
      } catch (error) {
        console.error("分析年份失敗:", error);
      } finally {
        isLoading.value = false;
      }
    };

    const handleYearInput = (event) => {
      const year = parseInt(event.target.value);
      if (year && year >= 1900 && year <= 2100) {
        taiSuiStore.setUrlYear(null);
        // 立即更新 URL 並重新分析
        updateURLParameter(year);
      }
    };

    // 添加鍵盤事件處理
    const handleKeyUp = (event) => {
      if (event.key === "Enter") {
        const year = parseInt(taiSuiStore.inputYear);
        if (year && year >= 1900 && year <= 2100) {
          updateURLParameter(year);
        }
      }
    };

    const handleReset = () => {
      taiSuiStore.resetAnalysis();
      // 清除 URL 參數
      router.push({ path: route.path });
    };

    const generateShareLink = () => {
      if (taiSuiStore.analysisResult) {
        const currentUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${currentUrl}?year=${taiSuiStore.analysisResult.year}`;

        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            alert(`已複製分享連結：${shareUrl}`);
          })
          .catch(() => {
            prompt("請複製以下連結分享：", shareUrl);
          });
      }
    };

    // 在 watch 監聽器中添加強制刷新
    watch(
      () => route.query.year,
      async (newYear) => {
        console.log("🔍 監聽到 URL year 參數變化:", newYear);

        if (newYear) {
          const year = parseInt(newYear);
          if (!isNaN(year) && year >= 1900 && year <= 2100) {
            console.log(`🔄 處理年份變化: ${year}`);
            taiSuiStore.setInputYear(year);
            await analyzeCurrentYear(year);

            // 強制重新渲染
            await nextTick();
          }
        } else {
          const currentYear = new Date().getFullYear();
          console.log("📅 使用當前年份:", currentYear);
          taiSuiStore.setInputYear(currentYear);
          await analyzeCurrentYear(currentYear);
          await nextTick();
        }
      },
      { immediate: true }
    );

    const handleScroll = () => {
      const header = document.querySelector("#sticky");
      if (window.pageYOffset > 0) {
        header.classList.add("sticky");
      } else {
        header.classList.remove("sticky");
      }
    };


    // 頁面加載時初始化
    onMounted(() => {
      console.log("🚀 TaiSui 組件掛載完成");
      window.addEventListener('scroll', handleScroll);

    });

    onMounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    return {
      taiSuiStore,
      isLoading,
      analyzeCurrentYear,
      handleYearInput,
      handleKeyUp,
      handleReset,
      generateShareLink,
    };
  },
};

// window.addEventListener('scroll', function() {
//     var header = document.querySelector('#sticky');
//     if (window.pageYOffset > 0) {
//         header.classList.add('sticky');
//     } else {
//         header.classList.remove('sticky');
//     }
// });

</script>

<style scoped>
/* 保持原有的 CSS 样式不变 */
.form-content {
  margin: 0 auto;
}

/* 增加粘性标题时的样式 */
.form-section.sticky {
  position: fixed;
  top: 0;
  /* min-width: auto; */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 可选：添加阴影效果 */
  /* 透過 left: 50% 和 transform: translateX(-50%) 讓固定元素在視窗水平置中，最大寬度限制與父容器一致。 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.form-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-section h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--light-color);
}

.form-section h3 {
  color: #333;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group.address-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-group.address-row label {
  width: 120px;
  margin-bottom: 0;
}

.form-group.address-row input {
  flex: 1;
}

.url-info {
  padding: 0.75rem;
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  color: #0066cc;
  font-size: 0.9rem;
}

.result-value {
  padding: 0.75rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1.2rem; /* 從 1rem 改為 1.2rem */
  font-weight: bold;
  text-align: center;
}

.zodiac-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.5rem; /* 從 1.1rem 改為 1.5rem */
}

.tai-sui-label {
  padding: 0.5rem;
  border-radius: 4px;
  color: white;
  text-align: center;
  font-weight: bold;
}

.tai-sui-label.value {
  background: #dc3545;
  color: white;
}
.tai-sui-label.chong {
  background: #fd7e14;
  color: white;
}
.tai-sui-label.hai {
  background: #20c997;
  color: white;
}
.tai-sui-label.po {
  background: #6f42c1;
  color: white;
}
.tai-sui-label.xing {
  background: #e83e8c;
  color: white;
}

.explanation-text {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.explanation-text pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.5;
  color: #333;
  font-size: 1.2rem; /* 從 1rem 改為 1.2rem */
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-color);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }

  .form-section {
    padding: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.address-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group.address-row label {
    width: auto;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .loading-indicator {
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: #0066cc;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  input:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
