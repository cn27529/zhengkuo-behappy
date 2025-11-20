<!-- src/views/PrintRegistration.vue -->
<template>
  <div class="print-registration">
    <!-- 列印控制欄（在應用內顯示返回按鈕） -->
    <div class="print-controls" v-if="!isPrinting">
      <div class="controls-left">
        <button @click="handleBack" class="back-btn">← 返回表單</button>
      </div>
      <div class="controls-right">
        <div class="download-dropdown">
          <button @click="toggleDownloadMenu" class="download-btn">
            📥 下載
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="showDownloadMenu" class="download-menu">
            <button @click="handleDownloadPDF" class="download-option">
              📄 下載為 PDF
            </button>
            <button @click="handleDownloadExcel" class="download-option">
              📊 下載為 Excel
            </button>
            <button @click="handleDownloadJSON" class="download-option">
              ⚙️ 下載為 JSON
            </button>
            <button @click="handleDownloadImage" class="download-option">
              🖼️ 下載為圖片
            </button>
            <button @click="handleDownloadText" class="download-option">
              📝 下載為文字檔
            </button>
          </div>
        </div>
        <button @click="handlePrint" class="print-btn">🖨️ 列印</button>
        <span class="print-tips">提示：建議使用橫向列印以獲得最佳效果</span>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在生成下載檔案...</p>
    </div>

    <!-- 列印內容 -->
    <div class="print-content" id="print-content">
      <!-- 表頭 -->
      <div class="print-header">
        <h1>{{ printData.contact?.name || '未填寫' }}-消災超度登記表</h1>
        <div class="print-meta">
          <p>列印時間：{{ printTime }}</p>
          <p>表單編號：{{ formId }}</p>
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
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'PrintRegistration',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const printData = ref({})
    const isPrinting = ref(false)
    const printTime = ref('')
    const formId = ref('')
    const showDownloadMenu = ref(false)
    const loading = ref(false)

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
        const print_id = route.query.print_id
        const form_id = route.query.form_id

        console.log('列印數據，ID:', print_id)

        if (!print_id) {
          throw new Error('無效的列印ID')
        }

        const storedData = localStorage.getItem(print_id)
        console.log('獲取的列印數據:', storedData)
        
        if (!storedData || storedData === 'undefined') {
          throw new Error('找不到列印數據或資料無效')
        }

        let parsed = {}
        try {
          parsed = JSON.parse(storedData)
          console.log('解析後的列印數據:', parsed)
        } catch (e) {
          throw new Error('列印數據格式錯誤')
        }

        printData.value = parsed
        formId.value = form_id || print_id

        // 設定頁面標題
        try {
          const contactName = (printData.value.contact?.name || '未填寫').toString().trim()
          document.title = `${contactName} - 消災超度登記表`
        } catch (e) {
          console.warn('設定 document.title 失敗:', e)
        }
        
      } catch (error) {
        console.error('載入列印數據失敗:', error)
        ElMessage.error('載入列印數據失敗，請返回重新操作')
        handleBack()
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

    // 切換下載選單
    const toggleDownloadMenu = () => {
      showDownloadMenu.value = !showDownloadMenu.value
    }

    // 點擊外部關閉選單
    const closeDownloadMenu = (event) => {
      if (!event.target.closest('.download-dropdown')) {
        showDownloadMenu.value = false
      }
    }

    // 1. 下載為 PDF（使用瀏覽器列印功能）
    const handleDownloadPDF = async () => {
      loading.value = true
      showDownloadMenu.value = false
      
      try {
        // 使用瀏覽器列印功能生成 PDF
        const printWindow = window.open('', '_blank')
        const printContent = document.getElementById('print-content').innerHTML
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.title}</title>
              <style>
                body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 20px; }
                .print-content { max-width: 21cm; margin: 0 auto; }
                .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .print-section { margin-bottom: 15px; page-break-inside: avoid; }
                .section-title { font-size: 16pt; border-bottom: 1px solid #333; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .text-center { text-align: center; }
                .text-left { text-align: left; }
                @page { size: A4; margin: 1cm; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `)
        
        printWindow.document.close()
        
        setTimeout(() => {
          printWindow.print()
          loading.value = false
          ElMessage.success('PDF 下載已開始')
        }, 500)
        
      } catch (error) {
        console.error('PDF 下載失敗:', error)
        ElMessage.error('PDF 下載失敗')
        loading.value = false
      }
    }

    // 2. 下載為 Excel
    const handleDownloadExcel = () => {
      loading.value = true
      showDownloadMenu.value = false
      
      try {
        // 建立 Excel 內容
        let excelContent = '消災超度登記表\n\n'
        excelContent += `聯絡人: ${printData.value.contact?.name || '未填寫'}\n`
        excelContent += `手機: ${printData.value.contact?.mobile || '未填寫'}\n`
        excelContent += `電話: ${printData.value.contact?.phone || '未填寫'}\n`
        excelContent += `關係: ${printData.value.contact?.relationship || '未填寫'}\n\n`
        
        // 消災人員
        excelContent += '消災人員:\n'
        excelContent += '序號,姓名,生肖,備註,戶長\n'
        availableBlessingPersons.value.forEach((person, index) => {
          excelContent += `${index + 1},${person.name || ''},${person.zodiac || ''},${person.notes || ''},${person.isHouseholdHead ? '是' : '否'}\n`
        })
        
        excelContent += '\n歷代祖先:\n'
        excelContent += '序號,姓氏,備註\n'
        availableAncestors.value.forEach((ancestor, index) => {
          excelContent += `${index + 1},${ancestor.surname || ''},${ancestor.notes || ''}\n`
        })
        
        excelContent += '\n陽上人:\n'
        excelContent += '序號,姓名,生肖,備註\n'
        availableSurvivors.value.forEach((survivor, index) => {
          excelContent += `${index + 1},${survivor.name || ''},${survivor.zodiac || ''},${survivor.notes || ''}\n`
        })
        
        // 建立 Blob 並下載
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
        downloadBlob(blob, `消災超度登記表_${formId.value}.xls`)
        ElMessage.success('Excel 檔案下載成功')
        
      } catch (error) {
        console.error('Excel 下載失敗:', error)
        ElMessage.error('Excel 下載失敗')
      } finally {
        loading.value = false
      }
    }

    // 3. 下載為 JSON
    const handleDownloadJSON = () => {
      showDownloadMenu.value = false
      
      try {
        const jsonData = {
          formId: formId.value,
          printTime: printTime.value,
          ...printData.value
        }
        
        const jsonString = JSON.stringify(jsonData, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        downloadBlob(blob, `消災超度登記表_${formId.value}.json`)
        ElMessage.success('JSON 檔案下載成功')
        
      } catch (error) {
        console.error('JSON 下載失敗:', error)
        ElMessage.error('JSON 下載失敗')
      }
    }

    // 4. 下載為圖片（使用 html2canvas）
    const handleDownloadImage = async () => {
      loading.value = true
      showDownloadMenu.value = false
      
      try {
        // 檢查是否已載入 html2canvas
        if (typeof html2canvas === 'undefined') {
          // 動態載入 html2canvas
          await loadHtml2Canvas()
        }
        
        const element = document.getElementById('print-content')
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
        
        canvas.toBlob((blob) => {
          downloadBlob(blob, `消災超度登記表_${formId.value}.png`)
          ElMessage.success('圖片下載成功')
          loading.value = false
        })
        
      } catch (error) {
        console.error('圖片下載失敗:', error)
        ElMessage.error('圖片下載失敗，請稍後再試')
        loading.value = false
      }
    }

    // 5. 下載為文字檔
    const handleDownloadText = () => {
      showDownloadMenu.value = false
      
      try {
        let textContent = '消災超度登記表\n'
        textContent += '='.repeat(50) + '\n\n'
        
        textContent += `聯絡人: ${printData.value.contact?.name || '未填寫'}\n`
        textContent += `手機: ${printData.value.contact?.mobile || '未填寫'}\n`
        textContent += `電話: ${printData.value.contact?.phone || '未填寫'}\n`
        textContent += `關係: ${printData.value.contact?.relationship || '未填寫'}\n\n`
        
        textContent += '消災人員:\n'
        textContent += '-'.repeat(30) + '\n'
        availableBlessingPersons.value.forEach((person, index) => {
          textContent += `${index + 1}. ${person.name || ''} (${person.zodiac || ''}) - ${person.notes || ''} ${person.isHouseholdHead ? '[戶長]' : ''}\n`
        })
        
        textContent += '\n歷代祖先:\n'
        textContent += '-'.repeat(30) + '\n'
        availableAncestors.value.forEach((ancestor, index) => {
          textContent += `${index + 1}. ${ancestor.surname || ''}氏歷代祖先 - ${ancestor.notes || ''}\n`
        })
        
        textContent += '\n陽上人:\n'
        textContent += '-'.repeat(30) + '\n'
        availableSurvivors.value.forEach((survivor, index) => {
          textContent += `${index + 1}. ${survivor.name || ''} (${survivor.zodiac || ''}) - ${survivor.notes || ''}\n`
        })
        
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
        downloadBlob(blob, `消災超度登記表_${formId.value}.txt`)
        ElMessage.success('文字檔下載成功')
        
      } catch (error) {
        console.error('文字檔下載失敗:', error)
        ElMessage.error('文字檔下載失敗')
      }
    }

    // 通用下載函數
    const downloadBlob = (blob, filename) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    // 動態載入 html2canvas
    const loadHtml2Canvas = () => {
      return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // 列印處理
    const handlePrint = () => {
      isPrinting.value = true
      showDownloadMenu.value = false
      
      setTimeout(() => {
        window.print()
        setTimeout(() => {
          isPrinting.value = false
        }, 1000)
      }, 500)
    }

    // 返回表單頁面
    const handleBack = () => {
      if (formId.value) {
        localStorage.removeItem(formId.value)
      }
      router.back()
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
      
      window.addEventListener('beforeprint', beforePrint)
      window.addEventListener('afterprint', afterPrint)
      document.addEventListener('click', closeDownloadMenu)
    })

    onUnmounted(() => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
      document.removeEventListener('click', closeDownloadMenu)
    })

    return {
      printData,
      isPrinting,
      printTime,
      formId,
      showDownloadMenu,
      loading,
      availableBlessingPersons,
      availableAncestors,
      availableSurvivors,
      currentHouseholdHeadsCount,
      handlePrint,
      handleBack,
      toggleDownloadMenu,
      handleDownloadPDF,
      handleDownloadExcel,
      handleDownloadJSON,
      handleDownloadImage,
      handleDownloadText
    }
  }
}
</script>

<style scoped>
/* 列印樣式保持不變 */
@media print {
  .print-controls {
    display: none !important;
  }
  
  .print-registration {
    margin: 0;
    padding: 0;
    width: 100%;
  }
  
  /* ... 其他列印樣式保持不變 ... */
}

/* 螢幕預覽樣式 - 增強控制欄 */
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
    position: relative;
  }
  
  .controls-left {
    display: flex;
    align-items: center;
  }
  
  .controls-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .back-btn {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    background: white;
    color: #333;
    transition: all 0.3s;
  }
  
  .back-btn:hover {
    background: #f0f0f0;
    border-color: #ccc;
  }
  
  /* 下載下拉選單樣式 */
  .download-dropdown {
    position: relative;
    display: inline-block;
  }
  
  .download-btn {
    padding: 10px 20px;
    border: 1px solid #007bff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    background: #007bff;
    color: white;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s;
  }
  
  .download-btn:hover {
    background: #0056b3;
    border-color: #0056b3;
  }
  
  .dropdown-arrow {
    font-size: 12px;
    transition: transform 0.3s;
  }
  
  .download-dropdown:hover .dropdown-arrow {
    transform: rotate(180deg);
  }
  
  .download-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    min-width: 200px;
    margin-top: 5px;
  }
  
  .download-option {
    display: block;
    width: 100%;
    padding: 10px 15px;
    border: none;
    background: white;
    cursor: pointer;
    text-align: left;
    font-size: 14px;
    transition: background 0.3s;
  }
  
  .download-option:hover {
    background: #f8f9fa;
  }
  
  .download-option:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
  
  .print-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    background: #28a745;
    color: white;
    transition: background 0.3s;
  }
  
  .print-btn:hover {
    background: #218838;
  }
  
  .print-tips {
    color: #666;
    font-size: 14px;
  }
  
  /* 載入狀態樣式 */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* ... 其他樣式保持不變 ... */
}

/* 響應式設計 */
@media (max-width: 768px) {
  .print-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .controls-left, .controls-right {
    width: 100%;
    justify-content: center;
  }
  
  .download-dropdown {
    width: 100%;
  }
  
  .download-btn {
    width: 100%;
    justify-content: center;
  }
  
  .download-menu {
    width: 100%;
    left: 0;
  }
  
  .print-tips {
    text-align: center;
    order: -1;
  }
}
</style>