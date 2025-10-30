<!-- src/views/TaiSui.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>犯太歲</h2>
    </div>

    <div class="form-content">
      <!-- 年份输入区域 -->
      <div class="form-section" style="display: none;">
        <h2>查詢年份</h2>
        <div class="form-grid">
          <div class="form-group address-row">
            <label for="yearInput">輸入年份</label>
            <input
              type="number"
              id="yearInput"
              v-model="taiSuiStore.inputYear"
              placeholder="請輸入年份，如：2025"
              @input="handleYearInput"
              @keyup.enter="analyzeCurrentYear"
            />
            <button
              type="button"
              class="btn btn-primary btn-sm"
              @click="analyzeCurrentYear"
            >
              查詢
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
        <h2>{{ taiSuiStore.analysisResult.year }}年太歲分析結果</h2>
        
        <!-- 天干地支信息 -->
        <div class="form-section" style="background: #f8f9fa; padding: 1.5rem;">
          <h3>天干地支基本信息</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>天干</label>
              <div class="result-value">{{ taiSuiStore.analysisResult.tiangan }}</div>
            </div>
            <div class="form-group">
              <label>地支</label>
              <div class="result-value">{{ taiSuiStore.analysisResult.dizhi }}</div>
            </div>
            <div class="form-group">
              <label>生肖</label>
              <div class="result-value zodiac-display">
                {{ taiSuiStore.analysisResult.zodiacIcon }} {{ taiSuiStore.analysisResult.zodiac }}
              </div>
            </div>
          </div>
        </div>

        <!-- 太歲類型 -->
        <div class="form-section" style="background: #fff3cd; padding: 1.5rem;">
          <h3>犯太歲生肖</h3>
          <div class="form-grid compact">
            <div class="form-group">
              <label class="tai-sui-label value">值太歲（本命年）</label>
              <div class="result-value zodiac-display">
                {{ taiSuiStore.getZodiacIcon(taiSuiStore.analysisResult.taiSuiTypes.valueTaiSui) }} {{ taiSuiStore.analysisResult.taiSuiTypes.valueTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label chong">沖太歲</label>
              <div class="result-value zodiac-display">
                {{ taiSuiStore.getZodiacIcon(taiSuiStore.analysisResult.taiSuiTypes.chongTaiSui) }} {{ taiSuiStore.analysisResult.taiSuiTypes.chongTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label hai">害太歲</label>
              <div class="result-value zodiac-display">
                {{ taiSuiStore.getZodiacIcon(taiSuiStore.analysisResult.taiSuiTypes.haiTaiSui) }} {{ taiSuiStore.analysisResult.taiSuiTypes.haiTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label po">破太歲</label>
              <div class="result-value zodiac-display">
                {{ taiSuiStore.getZodiacIcon(taiSuiStore.analysisResult.taiSuiTypes.poTaiSui) }} {{ taiSuiStore.analysisResult.taiSuiTypes.poTaiSui }}
              </div>
            </div>
            <div class="form-group">
              <label class="tai-sui-label xing">刑太歲</label>
              <div class="result-value zodiac-display">
                {{ taiSuiStore.getZodiacIcon(taiSuiStore.analysisResult.taiSuiTypes.xingTaiSui) }} {{ taiSuiStore.analysisResult.taiSuiTypes.xingTaiSui }}
              </div>
            </div>
          </div>
        </div>

        <!-- 解釋說明 -->
        <div class="form-section" style="background: #e7f3ff; padding: 1.5rem;">
          <h3>民俗解釋與建議</h3>
          <div class="explanation-text">
            <pre>{{ taiSuiStore.analysisResult.explanation }}</pre>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions" style="display: none;">
        <button type="button" class="btn btn-secondary" @click="handleReset">
          重置
        </button>
        <button type="button" class="btn btn-primary" @click="analyzeCurrentYear">
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
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaiSuiStore } from '../stores/taisui';

export default {
  name: "TaiSui",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const taiSuiStore = useTaiSuiStore();

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
      router.replace({
        path: currentPath,
        query: { year: year.toString() }
      });
    };

    const analyzeCurrentYear = () => {
      let yearToAnalyze;
      
      // 優先使用 URL 參數的年份
      const urlYearValue = getYearFromURL();
      if (urlYearValue) {
        yearToAnalyze = urlYearValue;
        taiSuiStore.setInputYear(yearToAnalyze);
      } else {
        yearToAnalyze = parseInt(taiSuiStore.inputYear);
      }

      try {
        taiSuiStore.performAnalysis(yearToAnalyze);
        // 更新 URL 參數
        updateURLParameter(yearToAnalyze);
      } catch (error) {
        alert(error.message);
      }
    };

    const handleYearInput = (event) => {
      const year = parseInt(event.target.value);
      if (year && year >= 1900 && year <= 2100) {
        taiSuiStore.setUrlYear(null);
      }
    };

    const handleReset = () => {
      taiSuiStore.resetAnalysis();
      // 清除 URL 參數
      router.replace({ path: route.path });
    };

    const generateShareLink = () => {
      if (taiSuiStore.analysisResult) {
        const currentUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${currentUrl}?year=${taiSuiStore.analysisResult.year}`;
        
        // 複製到剪貼簿
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert(`已複製分享連結：${shareUrl}`);
        }).catch(() => {
          // 如果剪貼簿 API 不可用，顯示連結
          prompt('請複製以下連結分享：', shareUrl);
        });
      }
    };

    // 監聽路由變化
    watch(
      () => route.query.year,
      (newYear) => {
        if (newYear) {
          const year = parseInt(newYear);
          if (!isNaN(year) && year >= 1900 && year <= 2100) {
            taiSuiStore.setInputYear(year);
            analyzeCurrentYear();
          }
        }
      }
    );

    // 页面加载时检查 URL 参数并分析
    onMounted(() => {
      const urlYearValue = getYearFromURL();
      if (urlYearValue) {
        taiSuiStore.setInputYear(urlYearValue);
      }
      analyzeCurrentYear();
    });

    return {
      taiSuiStore,
      analyzeCurrentYear,
      handleYearInput,
      handleReset,
      generateShareLink,
    };
  },
};
</script>

<style scoped>
/* 保持原有的 CSS 样式不变 */
.form-content {
  margin: 0 auto;
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

.tai-sui-label.value { background: #dc3545; color: white;}
.tai-sui-label.chong { background: #fd7e14; color: white;}
.tai-sui-label.hai { background: #20c997; color: white;}
.tai-sui-label.po { background: #6f42c1; color: white;}
.tai-sui-label.xing { background: #e83e8c; color: white;}

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
}
</style>