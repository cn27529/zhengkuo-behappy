<!-- src/views/PrintRegistration.vue -->
<template>
  <div class="print-registration">
    <!-- 列印控制欄（僅在預覽時顯示） -->
    <div class="print-controls" v-if="!isPrinting">
      <button @click="handlePrint" class="print-btn">🖨️ 列印</button>
      <button @click="handleClose" class="close-btn">✖️ 關閉</button>
      <span class="print-tips">提示：建議使用橫向列印以獲得最佳效果</span>
    </div>

    <!-- 列印內容 -->
    <div class="print-content">
      <!-- 表頭 -->
      <div class="print-header">
        <h1>{{ printData.contact?.name || '未填寫' }}-消災超度登記表</h1>
        <div class="print-meta">
          <p>列印時間：{{ printTime }}</p>
          <p style="display: none;">表單編號：{{ formId }}</p>
        </div>
      </div>

      <!-- 聯絡人信息 -->
      <div class="print-section">
        <h2 class="section-title">一、聯絡人信息</h2>
        <div class="section-content">
          <table class="info-table">
            <tbody>
            <tr>
              <td width="25%"><strong>聯絡人姓名：</strong></td>
              <td width="25%">{{ printData.contact?.name || '未填寫' }}</td>
              <td width="25%"><strong>手機號碼：</strong></td>
              <td width="25%">{{ printData.contact?.mobile || '未填寫' }}</td>
            </tr>
            <tr>
              <td><strong>家用電話：</strong></td>
              <td>{{ printData.contact?.phone || '未填寫' }}</td>
              <td><strong>資料表屬性：</strong></td>
              <td>
                {{ printData.contact?.relationship || '未填寫' }}
                <span v-if="printData.contact?.otherRelationship">
                  ({{ printData.contact.otherRelationship }})
                </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 消災祈福 -->
      <div class="print-section" v-if="printData.blessing">
        <h2 class="section-title">二、消災祈福</h2>
        <div class="section-content">
          <table class="info-table">
            <tbody>
            <tr>
              <td width="20%"><strong>地址：</strong></td>
              <td width="80%">{{ printData.blessing.address || '未填寫' }}</td>
            </tr>
            </tbody>
          </table>

          <!-- 消災人員列表 -->
          <div class="persons-list" v-if="printData.blessing.persons && printData.blessing.persons.length">
            <h3 class="sub-title">消災人員名單</h3>
            <table class="persons-table">
              <thead>
                <tr>
                  <th width="5%">序號</th>
                  <th width="20%">姓名</th>
                  <th width="15%">生肖</th>
                  <th width="50%">備註</th>
                  <th width="10%">戶長</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(person, index) in availableBlessingPersons" :key="person.id">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="text-center">{{ person.name || '未填寫' }}</td>
                  <td class="text-center">{{ person.zodiac || '未選擇' }}</td>
                  <td class="text-left">{{ person.notes || '無' }}</td>
                  <td class="text-center">{{ person.isHouseholdHead ? '✓' : '' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="persons-summary">
              共 {{ availableBlessingPersons.length }} 位人員
              <span v-if="currentHouseholdHeadsCount > 0">
                （其中 {{ currentHouseholdHeadsCount }} 位戶長）
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 超度祈福 -->
      <div class="print-section" v-if="printData.salvation">
        <h2 class="section-title">三、超度祈福</h2>
        <div class="section-content">
          <table class="info-table">
            <tbody>
            <tr>
              <td width="20%"><strong>地址：</strong></td>
              <td width="80%">{{ printData.salvation.address || '未填寫' }}</td>
            </tr>
            </tbody>
          </table>

          <!-- 歷代祖先 -->
          <div class="ancestors-list" v-if="printData.salvation.ancestors && printData.salvation.ancestors.length">
            <h3 class="sub-title">歷代祖先</h3>
            <table class="persons-table">
              <thead>
                <tr>
                  <th width="10%">序號</th>
                  <th width="40%">祖先姓氏</th>
                  <th width="50%">備註</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ancestor, index) in availableAncestors" :key="ancestor.id">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="text-center">{{ ancestor.surname || '未填寫' }} 氏歷代祖先</td>
                  <td class="text-left">{{ ancestor.notes || '無' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="persons-summary">
              共 {{ availableAncestors.length }} 位祖先
            </div>
          </div>

          <!-- 陽上人 -->
          <div class="survivors-list" v-if="printData.salvation.survivors && printData.salvation.survivors.length">
            <h3 class="sub-title">陽上人</h3>
            <table class="persons-table">
              <thead>
                <tr>
                  <th width="10%">序號</th>
                  <th width="25%">姓名</th>
                  <th width="15%">生肖</th>
                  <th width="50%">備註</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(survivor, index) in availableSurvivors" :key="survivor.id">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="text-center">{{ survivor.name || '未填寫' }}</td>
                  <td class="text-center">{{ survivor.zodiac || '未選擇' }}</td>
                  <td class="text-left">{{ survivor.notes || '無' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="persons-summary">
              共 {{ availableSurvivors.length }} 位陽上人
            </div>
          </div>
        </div>
      </div>

      <!-- 頁尾 -->
      <div class="print-footer">
        <p class="footer-note">本表單由系統自動生成，列印時間：{{ printTime }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'PrintRegistration',
  setup() {
    const printData = ref({})
    const isPrinting = ref(false)
    const printTime = ref('')
    const formId = ref('')

    // 計算屬性：過濾有效數據
    const availableBlessingPersons = computed(() => {
      return (printData.value.blessing?.persons || []).filter(person => 
        person.name && person.name.trim() !== ''
      )
    })

    const availableAncestors = computed(() => {
      return (printData.value.salvation?.ancestors || []).filter(ancestor => 
        ancestor.surname && ancestor.surname.trim() !== ''
      )
    })

    const availableSurvivors = computed(() => {
      return (printData.value.salvation?.survivors || []).filter(survivor => 
        survivor.name && survivor.name.trim() !== ''
      )
    })

    const currentHouseholdHeadsCount = computed(() => {
      return availableBlessingPersons.value.filter(person => person.isHouseholdHead).length
    })

    // 載入列印數據
    const loadPrintData = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const printId = urlParams.get('id')

        if (!printId) {
          throw new Error('無效的列印ID')
        }

        const storedData = sessionStorage.getItem(printId)
        // 驗證資料存在且不是字串 'undefined' 或空字串
        if (!storedData || storedData === 'undefined') {
          console.error('列印數據不存在或為無效字串', { printId, storedData })
          throw new Error('找不到列印數據或資料無效')
        }

        let parsed
        try {
          parsed = JSON.parse(storedData)
        } catch (e) {
          console.error('解析列印數據失敗，可能格式錯誤', { printId, storedData, error: e })
          throw new Error('列印數據格式錯誤')
        }

        printData.value = parsed
        formId.value = printId
      } catch (error) {
        console.error('載入列印數據失敗:', error)
        alert('載入列印數據失敗，請返回重新操作')
      }
    }

    // 設置列印時間
    const setPrintTime = () => {
      const now = new Date()
      printTime.value = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 列印處理
    const handlePrint = () => {
      isPrinting.value = true
      
      // 延遲執行列印，確保樣式已應用
      setTimeout(() => {
        window.print()
        // 列印後恢復狀態
        setTimeout(() => {
          isPrinting.value = false
        }, 1000)
      }, 500)
    }

    // 關閉視窗
    const handleClose = () => {
      window.close()
    }

    // 監聽列印事件
    const beforePrint = () => {
      isPrinting.value = true
    }

    const afterPrint = () => {
      isPrinting.value = false
    }

    onMounted(() => {
      setPrintTime()
      loadPrintData()
      
      // 添加列印事件監聽
      window.addEventListener('beforeprint', beforePrint)
      window.addEventListener('afterprint', afterPrint)
    })

    onUnmounted(() => {
      // 清理事件監聽
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
    })

    return {
      printData,
      isPrinting,
      printTime,
      formId,
      availableBlessingPersons,
      availableAncestors,
      availableSurvivors,
      currentHouseholdHeadsCount,
      handlePrint,
      handleClose
    }
  }
}
</script>

<style scoped>
/* 列印樣式 */
@media print {
  .print-controls {
    display: none !important;
  }
  
  .print-registration {
    margin: 0;
    padding: 0;
    width: 100%;
    font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif;
  }
  
  .print-content {
    font-size: 12pt;
    line-height: 1.4;
    color: #000;
  }
  
  .print-header {
    text-align: center;
    margin-bottom: 20pt;
    padding-bottom: 10pt;
    border-bottom: 2pt solid #333;
  }
  
  .print-header h1 {
    font-size: 18pt;
    margin: 0 0 10pt 0;
    color: #000;
  }
  
  .print-meta {
    font-size: 10pt;
    color: #666;
  }
  
  .print-section {
    margin-bottom: 15pt;
    page-break-inside: avoid;
  }
  
  .section-title {
    font-size: 14pt;
    margin: 5pt 0 5pt 0;
    padding: 5pt 0;
    border-bottom: 1pt solid #333;
    color: #000;
  }
  
  .sub-title {
    font-size: 12pt;
    margin: 5pt 0 5pt 0;
    color: #000;
  }
  
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin: 5pt 0;
    font-size: 11pt;
  }
  
  .info-table td {
    padding: 4pt 8pt;
    border: 1pt solid #ddd;
  }
  
  .persons-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1pt 0;
    font-size: 10pt;
  }
  
  .persons-table th,
  .persons-table td {
    padding: 3pt 6pt;
    border: 1pt solid #ddd;
    text-align: center;
  }
  
  .persons-table th {
    background-color: #f5f5f5;
    font-weight: bold;
  }
  
  .text-center {
    text-align: center;
  }
  
  .text-left {
    text-align: left;
  }
  
  .persons-summary {
    font-size: 10pt;
    text-align: right;
    margin-top: 5pt;
    color: #666;
  }
  
  .print-footer {
    text-align: center;
    margin-top: 20pt;
    padding-top: 10pt;
    border-top: 1pt solid #333;
    font-size: 10pt;
    color: #666;
  }
  
  /* 確保在列印時不會被分頁切斷 */
  .print-section {
    page-break-inside: avoid;
  }
  
  .persons-table {
    page-break-inside: avoid;
  }
  
  /* 橫向列印建議 */
  @page {
    size: A4;
    margin: 1cm;
  }
}

/* 螢幕預覽樣式 */
@media screen {
  .print-registration {
    max-width: 21cm;
    margin: 5px auto;
    padding: 10px;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  
  .print-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 5px;
    gap: 15px;
  }
  
  .print-btn, .close-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  }
  
  .print-btn {
    background: #4CAF50;
    color: white;
  }
  
  .print-btn:hover {
    background: #45a049;
  }
  
  .close-btn {
    background: #f44336;
    color: white;
  }
  
  .close-btn:hover {
    background: #da190b;
  }
  
  .print-tips {
    color: #666;
    font-size: 14px;
  }
  
  .print-content {
    font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif;
    line-height: 1.6;
  }
  
  .print-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid #333;
  }
  
  .print-header h1 {
    margin: 0 0 5px 0;
    color: #333;
  }
  
  .print-meta {
    color: #666;
    font-size: 14px;
  }
  
  .print-section {
    margin-bottom: 15px;
  }
  
  .section-title {
    margin: 5px 0 5px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #333;
    color: #333;
  }
  
  .sub-title {
    margin: 5px 0 10px 0;
    color: #333;
  }
  
  .info-table, .persons-table {
    width: 100%;
    border-collapse: collapse;
    margin: 5px 0;
  }
  
  .info-table td, .persons-table th, .persons-table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
  }
  
  .persons-table th {
    background-color: #f8f9fa;
    font-weight: bold;
  }
  
  .persons-summary {
    text-align: right;
    margin-top: 10px;
    color: #666;
    font-style: italic;
  }
  
  .print-footer {
    text-align: center;
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #333;
    color: #666;
  }
}

/* 通用樣式 */
.print-content {
  color: #333;
}

.section-content {
  margin-left: 10px;
}

strong {
  font-weight: bold;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .print-controls {
    flex-direction: column;
    text-align: center;
  }
  
  .print-tips {
    order: -1;
    margin-bottom: 10px;
  }
}
</style>