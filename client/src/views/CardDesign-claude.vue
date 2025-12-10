<template>
  <div class="container">
    <div class="main-content">
      <!-- 左側卡片預覽區域 -->
      <section class="card-preview">
        <h2 class="section-title">卡片預覽區</h2>
        <div class="card-container">
          <div class="card-bg" id="cardBg">
            <div
              class="drop-zone"
              id="dropZone"
              @dragover.prevent="onDragOver"
              @drop="onDrop"
              @dragenter="onDragEnter"
              @dragleave="onDragLeave"
              ref="dropZoneRef"
            >
              <!-- 已放置的項目 -->
              <div
                v-for="item in cardStore.droppedItems"
                :key="item.id"
                class="dropped-item"
                :style="{ left: `${item.x}px`, top: `${item.y}px` }"
                @mousedown="startDragging(item.id, $event)"
                @mouseenter="hoveredItemId = item.id"
                @mouseleave="hoveredItemId = null"
                :class="{ selected: selectedItemId === item.id }"
              >
                <div class="item-content">{{ item.content }}</div>
                <div
                  style="
                    font-size: 1.3rem;
                    font-family: 標楷體;
                    color: #333;
                    text-align: center;
                    margin: 0px;
                    border: 0px solid #333;
                    font-weight: bold;
                  "
                  v-for="value in item.content.length"
                >
                  {{ item.content[value - 1] }}
                </div>
                <button
                  class="delete-btn"
                  @click.stop="deleteItem(item.id)"
                  v-show="
                    hoveredItemId === item.id || selectedItemId === item.id
                  "
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </div>

              <!-- 空狀態提示 -->
              <div
                class="empty-state"
                v-if="cardStore.droppedItems.length === 0"
              >
                <p>從右側拖拽</p>
                <p>祈福到這裡</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右側數據區域 -->
      <section class="card-data">
        <h2 class="section-title">卡片數據區</h2>

        <div class="data-section">
          <h3 class="section-title">基本信息</h3>
          <div
            class="data-item"
            draggable="true"
            @dragstart="onDragStart($event, 'name')"
            @dragend="onDragEnd"
          >
            <!-- <div class="data-label">姓名</div> -->
            <div class="data-value">{{ cardStore.cardData.name }}</div>
          </div>

          <div
            class="data-item"
            draggable="true"
            @dragstart="onDragStart($event, 'nickname')"
            @dragend="onDragEnd"
          >
            <!-- <div class="data-label">暱稱</div> -->
            <div class="data-value">{{ cardStore.cardData.nickname }}</div>
          </div>
        </div>

        <div class="data-section">
          <h3 class="section-title">祝賀詞</h3>
          <div class="blessings-list">
            <div
              v-for="(blessing, index) in cardStore.cardData.blessings"
              :key="index"
              class="blessing-item"
              draggable="true"
              @dragstart="onDragStart($event, 'blessing', blessing)"
              @dragend="onDragEnd"
            >
              <div class="blessing-text">{{ blessing }}</div>
            </div>
          </div>
        </div>

        <div class="instructions">
          <h3>使用說明</h3>
          <ul>
            <li>從右側拖拽任意數據到左側卡片區域</li>
            <li>在卡片區域內拖拽元素可以調整位置</li>
            <li>鼠標懸停在元素上，點擊右上角刪除按鈕可以移除</li>
            <li>點擊"保存"保存當前設計</li>
            <li>點擊"列印"下載卡片</li>
          </ul>
        </div>

        <!-- 按鈕區域 - 使用 Element Plus 按鈕 -->
        <div class="form-actions">
          <el-button type="success" @click="handleSaveDesign" :loading="saving"
            >🚀 保存
          </el-button>

          <el-button type="primary" @click="handlePrintCard" :loading="printing"
            >🖨️ 列印/下載卡片
          </el-button>
          <el-button type="info" @click="handleResetDesign">
            🔄️ 重置設計
          </el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue";
import { useCardStore } from "../stores/cardStore.js";
import { Plus, Edit, Check, Delete } from "@element-plus/icons-vue";
// 移除直接導入 html2canvas
// import html2canvas from 'html2canvas'
import { ElMessage, ElMessageBox } from "element-plus";

// 使用卡片 store
const cardStore = useCardStore();

// DOM 引用
const dropZoneRef = ref(null);

// 響應式狀態
const hoveredItemId = ref(null);
const selectedItemId = ref(null);
const saving = ref(false);
const printing = ref(false);

// 拖拽狀態
const dragState = reactive({
  isDragging: false,
  draggedItem: null,
  draggedItemType: "",
  draggedItemContent: "",
});

// 元素拖拽狀態
const itemDragState = reactive({
  isDragging: false,
  draggingItemId: null,
  offsetX: 0,
  offsetY: 0,
});

// 初始化數據
onMounted(() => {
  // 從 store 加載已保存的設計
  cardStore.loadSavedDesign();

  // 添加全局鼠標事件監聽器
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

// 清理事件監聽器
onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});

// 拖拽開始處理
const onDragStart = (event, type, content = null) => {
  dragState.isDragging = true;

  if (type === "name") {
    dragState.draggedItemType = "name";
    dragState.draggedItemContent = cardStore.cardData.name;
  } else if (type === "nickname") {
    dragState.draggedItemType = "nickname";
    dragState.draggedItemContent = cardStore.cardData.nickname;
  } else if (type === "blessing" && content) {
    dragState.draggedItemType = "blessing";
    dragState.draggedItemContent = content;
  }

  // 設置拖拽效果
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({
      type: dragState.draggedItemType,
      content: dragState.draggedItemContent,
    })
  );
  event.dataTransfer.effectAllowed = "copy";

  // 添加拖拽視覺反饋
  event.target.style.opacity = "0.6";
};

// 拖拽結束處理
const onDragEnd = () => {
  dragState.isDragging = false;

  // 恢復所有可拖拽元素的透明度
  document.querySelectorAll('[draggable="true"]').forEach((item) => {
    item.style.opacity = "1";
  });
};

// 拖拽進入放置區域
const onDragEnter = (event) => {
  event.preventDefault();
  if (dropZoneRef.value) {
    dropZoneRef.value.style.backgroundColor = "rgba(214, 51, 132, 0.05)";
  }
};

// 拖拽離開放置區域
const onDragLeave = (event) => {
  // 只有當離開到放置區域之外時才移除背景色
  if (!event.currentTarget.contains(event.relatedTarget) && dropZoneRef.value) {
    dropZoneRef.value.style.backgroundColor = "";
  }
};

// 拖拽在放置區域上
const onDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
};

// 放置處理
const onDrop = (event) => {
  event.preventDefault();

  // 移除放置區域的背景色
  if (dropZoneRef.value) {
    dropZoneRef.value.style.backgroundColor = "";
  }

  // 獲取放置位置（相對於放置區域）
  const rect = dropZoneRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 獲取拖拽數據
  let data;
  try {
    data = JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch (error) {
    // 如果無法解析JSON，則使用拖拽狀態中的數據
    data = {
      type: dragState.draggedItemType,
      content: dragState.draggedItemContent || "祝賀您！",
    };
  }

  // 創建新元素
  createDroppedItem(data, x, y);

  // 恢復拖拽元素的透明度
  document.querySelectorAll('[draggable="true"]').forEach((item) => {
    item.style.opacity = "1";
  });
};

// 創建被放置的元素
const createDroppedItem = (data, x, y) => {
  if (!data.type || !data.content) return;

  // 為每個元素生成唯一ID
  const id = "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  // 添加到 store
  cardStore.addDroppedItem({
    id,
    type: data.type,
    content: data.content,
    label: getItemTypeLabel(data.type),
    x: x - 60, // 調整位置使元素中心在鼠標位置
    y: y - 40,
    width: 200,
    height: 80,
  });

  // 顯示成功消息
  ElMessage({
    message: "已添加元素到卡片",
    type: "success",
    duration: 2000,
  });
};

// 獲取項目類型標籤
const getItemTypeLabel = (type) => {
  switch (type) {
    case "name":
      return "姓名";
    case "nickname":
      return "暱稱";
    case "blessing":
      return "祝福";
    default:
      return "項目";
  }
};

// 開始拖動已放置的元素
const startDragging = (itemId, event) => {
  // 只對主按鈕點擊有效（左鍵）
  if (event.button !== 0) return;

  itemDragState.isDragging = true;
  itemDragState.draggingItemId = itemId;
  selectedItemId.value = itemId;

  // 計算鼠標相對於元素位置的偏移
  const element = event.target.closest(".dropped-item");
  if (!element) return;

  const rect = element.getBoundingClientRect();
  itemDragState.offsetX = event.clientX - rect.left;
  itemDragState.offsetY = event.clientY - rect.top;

  // 防止文本選中
  event.preventDefault();
};

// 鼠標移動處理
const onMouseMove = (event) => {
  if (!itemDragState.isDragging || !itemDragState.draggingItemId) return;

  // 計算新位置
  const dropZoneRect = dropZoneRef.value.getBoundingClientRect();
  let newX = event.clientX - dropZoneRect.left - itemDragState.offsetX;
  let newY = event.clientY - dropZoneRect.top - itemDragState.offsetY;

  // 確保元素不會完全移出放置區域
  const element = document.querySelector(
    `[data-id="${itemDragState.draggingItemId}"]`
  );
  const elementWidth = element ? element.offsetWidth : 200;
  const elementHeight = element ? element.offsetHeight : 80;

  newX = Math.max(0, Math.min(newX, dropZoneRect.width - elementWidth));
  newY = Math.max(0, Math.min(newY, dropZoneRect.height - elementHeight));

  // 更新 store 中元素的位置
  cardStore.updateItemPosition(itemDragState.draggingItemId, newX, newY);
};

// 鼠標釋放處理
const onMouseUp = () => {
  if (itemDragState.isDragging) {
    itemDragState.isDragging = false;
    itemDragState.draggingItemId = null;

    // 顯示位置更新消息
    ElMessage({
      message: "元素位置已更新",
      type: "info",
      duration: 1500,
    });
  }
};

// 刪除元素
const deleteItem = (itemId) => {
  cardStore.deleteDroppedItem(itemId);
  if (selectedItemId.value === itemId) {
    selectedItemId.value = null;
  }

  // 顯示刪除成功消息
  ElMessage({
    message: "元素已刪除",
    type: "warning",
    duration: 2000,
  });
};

// 保存設計
const handleSaveDesign = async () => {
  try {
    saving.value = true;
    await cardStore.saveDesign();

    ElMessage({
      message: "設計已保存成功！",
      type: "success",
      duration: 3000,
    });
  } catch (error) {
    console.error("保存設計時出錯:", error);

    ElMessage({
      message: "保存失敗，請重試",
      type: "error",
      duration: 3000,
    });
  } finally {
    saving.value = false;
  }
};

// 動態加載 html2canvas（與 RegistrationPrint.vue 相同的方式）
const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    // 檢查是否已經加載
    if (typeof window.html2canvas !== "undefined") {
      resolve();
      return;
    }

    // 創建 script 元素動態加載
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => {
      console.log("html2canvas 加載成功");
      resolve();
    };
    script.onerror = (error) => {
      console.error("html2canvas 加載失敗:", error);
      reject(new Error("html2canvas 加載失敗"));
    };
    document.head.appendChild(script);
  });
};

// 列印/下載卡片（使用與 RegistrationPrint.vue 相同的方式）
const handlePrintCard = async () => {
  try {
    printing.value = true;

    // 使用 Element Plus 消息提示
    ElMessage({
      message: "正在生成圖片，請稍候...",
      type: "info",
      duration: 2000,
    });

    // 檢查是否已載入 html2canvas
    if (typeof window.html2canvas === "undefined") {
      // 動態載入 html2canvas（與 RegistrationPrint.vue 相同的方式）
      await loadHtml2Canvas();
    }

    // 使用html2canvas將卡片區域轉換為圖片
    const cardContainer = document.querySelector(".card-container");
    //const cardContainer = document.querySelector(".card-bg");

    console.log("cardContainer:", cardContainer.innerHTML);

    // 等待下一個渲染周期確保所有元素都已渲染
    await nextTick();

    const canvas = await window.html2canvas(cardContainer, {
      backgroundColor: "#f8f0e3",
      scale: 2, // 提高分辨率
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    // 創建下載鏈接
    const link = document.createElement("a");
    link.download = `祝賀卡片_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    ElMessage({
      message: "卡片圖片已下載成功！",
      type: "success",
      duration: 3000,
    });
  } catch (error) {
    console.error("生成圖片時出錯:", error);

    let errorMessage = "生成圖片時出錯，請重試";
    if (error.message === "html2canvas 加載失敗") {
      errorMessage = "html2canvas 庫加載失敗，請檢查網絡連接";
    }

    ElMessage({
      message: errorMessage,
      type: "error",
      duration: 3000,
    });
  } finally {
    printing.value = false;
  }
};

// 重置設計
const handleResetDesign = () => {
  ElMessageBox.confirm("確定要重置所有設計嗎？此操作不可撤銷。", "重置確認", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning",
    center: true,
  })
    .then(() => {
      cardStore.resetDesign();
      selectedItemId.value = null;

      ElMessage({
        message: "設計已重置！",
        type: "success",
        duration: 3000,
      });
    })
    .catch(() => {
      // 用戶取消了操作
      ElMessage({
        message: "已取消重置操作",
        type: "info",
        duration: 2000,
      });
    });
};
</script>

<style scoped>
.form-actions {
  flex-direction: column;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Segoe UI", "Microsoft JhengHei", sans-serif;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

header {
  background: linear-gradient(135deg, #d63384, #9c27b0);
  color: white;
  padding: 22px 30px;
  text-align: center;
}

h1 {
  font-size: 2.2rem;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.main-content {
  display: flex;
  min-height: 700px;
}

/* 左側卡片區域 */
.card-preview {
  flex: 1;
  background-color: #fff9f9;
  padding: 25px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eee;
}

.card-container {
  flex: 1;
  border-radius: 0px;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  border: 0px solid #e6d8c3;
  opacity: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-bg {
  /* 固定卡片尺寸比例，例如 A4 直式比例 */
  width: 100%;
  max-width: 600px;
  aspect-ratio: 3/4; /* 或根據您的模板實際比例調整 */
  background-image: url("../data/card-template-001.jpg");
  background-size: 100% 100%; /* 完全填滿容器 */
  background-repeat: no-repeat;
  background-position: 0 0; /* 從左上角開始 */
  position: relative;
}

.drop-zone {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.dropped-item {
  position: absolute;
  /* padding: 12px 18px;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
  border: 0px solid rgba(214, 51, 132, 0.3);
  max-width: 150px;
  cursor: move;
  /* transition: box-shadow 0.2s; */
  z-index: 10;
}

.dropped-item:hover {
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(214, 51, 132, 0.3);
  z-index: 100;
}

.dropped-item.selected {
  /* border: 0px solid #d63384; */
  box-shadow: 0 0 0 0px rgba(214, 51, 132, 0.2);
}

.item-content {
  font-size: 0.5rem;
  color: #333;
  text-align: center;
  opacity: 0;
}

.item-type {
  font-size: 0.75rem;
  color: #d63384;
  margin-bottom: 4px;
  font-weight: bold;
  display: none;
}

.delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  /* background-color: #ff4757; */
  opacity: 0;
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 12px;
  cursor: pointer;
  z-index: 101;
}

.delete-btn:hover {
  background-color: #ff4757;
  opacity: 1;
}

/* 右側數據區域 */
.card-data {
  width: 400px;
  padding: 25px;
  background-color: #f9f9f9;
  overflow-y: auto;
}

.section-title {
  font-size: 1.3rem;
  color: #d63384;
  margin-bottom: 18px;
  padding-bottom: 8px;
  border-bottom: 2px solid #eee;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 10px;
}

.data-item {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.data-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border-color: #d63384;
}

.data-item:active {
  cursor: grabbing;
}

.data-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.data-value {
  font-size: 1.1rem;
  color: #333;
  font-weight: 500;
}

.blessings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.blessing-item {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.blessing-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border-color: #9c27b0;
}

.blessing-item:active {
  cursor: grabbing;
}

.blessing-text {
  font-size: 1.05rem;
  color: #333;
  line-height: 1.5;
}

/* 按鈕區域 */
.actions {
  padding: 25px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
}

/* 調整 Element Plus 按鈕樣式以匹配原有設計 */
.actions .el-button {
  padding: 14px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
  border-radius: 8px;
}

.actions .el-button:hover {
  transform: translateY(-2px);
}

.instructions {
  background-color: #e7f3ff;
  border-radius: 8px;
  padding: 18px;
  margin-top: 25px;
  border-left: 4px solid #007bff;
}

.instructions h3 {
  color: #007bff;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.instructions ul {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #aaa;
  z-index: 0;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.2rem;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .card-data {
    width: 100%;
  }

  .actions {
    flex-direction: column;
    align-items: center;
  }

  .actions .el-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>
