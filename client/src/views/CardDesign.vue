<template>
  <div class="card-content">
    <!-- 左側卡片預覽區域 -->
    <section class="card-preview">
      <h2 class="section-title">卡片預覽區</h2>
      <div class="card-container">
        <div class="card-bg" id="cardBg" ref="cardBgRef">
          <img :src="cardBgImageSrc" class="card-bg-image" />
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
              :style="getDroppedItemStyle(item)"
              @mousedown="startDragging(item.id, $event)"
              @mouseenter="hoveredItemId = item.id"
              @mouseleave="hoveredItemId = null"
              :class="{ selected: selectedItemId === item.id }"
            >
              <!-- 垂直排列的文字 -->
              <div
                style="
                  font-size: 1.3rem;
                  font-family: 標楷體;
                  color: #333;
                  text-align: center;
                  margin: -5px;
                  border: 0px solid #333;
                  font-weight: bold;
                "
                v-for="(char, index) in item.content"
                :key="index"
              >
                {{ char }}
              </div>
              <button
                class="delete-btn"
                @click.stop="deleteItem(item.id)"
                v-show="hoveredItemId === item.id || selectedItemId === item.id"
              >
                <el-icon><Delete /></el-icon>
              </button>
            </div>

            <!-- 空狀態提示 -->
            <div class="empty-state" v-if="cardStore.droppedItems.length === 0">
              <p>從右側拖拽</p>
              <p>祈福到這裡</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 右側數據區域 -->
    <section class="card-data">
      <h2 class="section-title">卡片數據</h2>

      <div class="data-section" style="display: block">
        <!-- <h3 class="section-title">卡片模版</h3> -->
        <div class="form-switcher">
          <div class="form-tabs">
            <div
              class="form-tab"
              v-for="template in cardStore.cardTemplates"
              :key="template.id"
              :class="{ active: selectedCardBgImage === template.id }"
              @click="handleCardBgImage(template.id)"
            >
              🧧{{ template.name }}
            </div>
          </div>
        </div>
      </div>
      <!-- 基本信息 -->
      <div class="data-section" style="display: none">
        <h3 class="section-title">基本信息</h3>
        <div
          class="data-item"
          draggable="true"
          @dragstart="onDragStart($event, 'name', cardStore.cardData.name)"
          @dragend="onDragEnd"
        >
          <div class="data-value">{{ cardStore.cardData.name }}</div>
        </div>
      </div>

      <!-- 消災地址 -->
      <div class="data-section">
        <h3 class="section-title">消災地址</h3>
        <div
          class="data-item"
          draggable="true"
          @dragstart="
            onDragStart(
              $event,
              'blessingAddress',
              cardStore.cardData.blessingAddress,
            )
          "
          @dragend="onDragEnd"
        >
          <div class="data-value">{{ cardStore.cardData.blessingAddress }}</div>
        </div>

        <div class="data-list">
          <div
            v-for="(person, index) in cardStore.cardData.persons"
            :key="index"
            class="data-item"
            draggable="true"
            @dragstart="onDragStart($event, 'person', person)"
            @dragend="onDragEnd"
          >
            <div class="data-value">{{ person }}</div>
          </div>
        </div>
      </div>

      <!-- 超度地址 -->
      <div class="data-section">
        <h3 class="section-title">超度地址</h3>
        <div
          class="data-item"
          draggable="true"
          @dragstart="
            onDragStart(
              $event,
              'salvationAddress',
              cardStore.cardData.salvationAddress,
            )
          "
          @dragend="onDragEnd"
        >
          <div class="data-value">
            {{ cardStore.cardData.salvationAddress }}
          </div>
        </div>

        <!-- 祖先 -->
        <div class="data-list">
          <div
            v-for="(ancestor, index) in cardStore.cardData.ancestors"
            :key="index"
            class="data-item"
            draggable="true"
            @dragstart="
              onDragStart($event, 'ancestor', ancestor + '氏歷代祖先')
            "
            @dragend="onDragEnd"
          >
            <div class="data-value">{{ ancestor + "氏歷代祖先" }}</div>
          </div>
        </div>
      </div>

      <!-- 陽上人 -->
      <div class="data-section">
        <h3 class="section-title">陽上人</h3>
        <div class="data-list">
          <div
            v-for="(survivor, index) in cardStore.cardData.survivors"
            :key="index"
            class="data-item"
            draggable="true"
            @dragstart="onDragStart($event, 'survivor', survivor)"
            @dragend="onDragEnd"
          >
            <div class="data-value">{{ survivor }}</div>
          </div>
        </div>
      </div>
      <div class="use-help">
        <h3>使用說明</h3>
        <ul>
          <li>從右側拖拽任意數據到左側卡片區域</li>
          <li>在卡片區域內拖拽元素可以調整位置</li>
          <li>鼠標懸停在元素上，點擊右上角刪除按鈕可以移除</li>
          <li>點擊"保存"保存當前設計</li>
          <li>點擊"列印"下載卡片</li>
        </ul>
      </div>

      <div class="data-section">
        <h3 class="section-title">操作</h3>
        <!-- 按鈕區域 - 使用 Element Plus 按鈕 -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-primary"
            @click="handleSaveDesign"
            :loading="saving"
          >
            保存
          </button>
          <button
            type="button"
            class="btn btn-outline capsule-btn"
            @click="handlePrintCard"
            :loading="printing"
          >
            📥 下載卡片
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleResetDesign"
          >
            🔄️ 重置設計
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useCardStore } from "../stores/cardStore.js";
import { Delete } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePageStateStore } from "../stores/pageStateStore.js";
//import { useRegistrationStore } from "../stores/registrationStore.js";
import html2canvas from "html2canvas";

// 使用卡片 store
const cardStore = useCardStore();
const pageStateStore = usePageStateStore();
//const registrationStore = useRegistrationStore();

// DOM 引用
const dropZoneRef = ref(null);
//const cardContainerRef = ref(null);
const cardBgRef = ref(null);
const cardBgImageSrc = ref("/src/data/card-template-zk01b.png"); // 預設卡片模版

// 響應式狀態
const hoveredItemId = ref(null);
const selectedItemId = ref(null);
const saving = ref(false);
const printing = ref(false);
const selectedCardBgImage = ref("zk01b"); // 預設選擇第一個模版

// 可以動態更換圖片
const handleCardBgImage = (cardName) => {
  cardBgImageSrc.value = `/src/data/card-template-${cardName}.png`;
  selectedCardBgImage.value = cardName;
};

// 卡片尺寸狀態
const cardDimensions = reactive({
  width: 0,
  height: 0,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
});

// 計算背景圖位置
const calculateCardDimensions = () => {
  if (!cardBgRef.value) return;

  const container = cardBgRef.value;
  const bgImage = new Image();
  bgImage.src = "../data/card-template-zk01.png";

  // 獲取容器尺寸
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 計算圖片縮放比例（假設圖片原始比例）
  const imageAspectRatio = 2 / 3; // 假設卡片模版是2:3比例
  const containerAspectRatio = containerWidth / containerHeight;

  if (containerAspectRatio > imageAspectRatio) {
    // 容器較寬，圖片高度填滿
    cardDimensions.height = containerHeight;
    cardDimensions.width = containerHeight * imageAspectRatio;
    cardDimensions.offsetX = (containerWidth - cardDimensions.width) / 2;
    cardDimensions.offsetY = 0;
  } else {
    // 容器較高，圖片寬度填滿
    cardDimensions.width = containerWidth;
    cardDimensions.height = containerWidth / imageAspectRatio;
    cardDimensions.offsetX = 0;
    cardDimensions.offsetY = (containerHeight - cardDimensions.height) / 2;
  }

  console.log("卡片尺寸計算:", cardDimensions);
};

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

// 計算拖拽元素樣式
const getDroppedItemStyle = (item) => {
  // 根據卡片實際顯示位置調整坐標
  const adjustedX = item.x - cardDimensions.offsetX;
  const adjustedY = item.y - cardDimensions.offsetY;

  return {
    left: `${adjustedX}px`,
    top: `${adjustedY}px`,
    transform: "translate(0, 0)", // 避免transform影響定位
  };
};

// 新增：模式判断
const myPageState = computed(() => {
  const state = pageStateStore.loadPageState("registration");
  console.log("🔧 myPageState 調試信息:", { state });
  return state;
});

const loadFormData = async () => {
  const state = myPageState.value;
  const propsData = {
    id: state.id,
    formId: state.formId,
    action: state.action,
  };

  if (state.action === "edit") {
    await cardStore.loadFormData(propsData);
  }
};

// 初始化數據
onMounted(async () => {
  console.log("🚀 CardDesign 組件已掛載");

  await loadFormData();

  // 從 store 加載已保存的設計
  cardStore.loadSavedDesign();

  // 添加全局鼠標事件監聽器
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  // 計算卡片尺寸
  setTimeout(() => {
    calculateCardDimensions();
    // 監聽窗口大小變化
    window.addEventListener("resize", calculateCardDimensions);
  }, 100);
});

// 清理事件監聽器
onUnmounted(() => {
  console.log("🗑️ CardDesign 組件已卸載");
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  window.removeEventListener("resize", calculateCardDimensions);
});

// 拖拽開始處理
const onDragStart = (event, type, content = null) => {
  dragState.isDragging = true;

  if (type === "name" && content) {
    dragState.draggedItemType = type;
    dragState.draggedItemContent = content;
  }
  // 消災地址
  if (type === "blessingAddress" && content) {
    dragState.draggedItemType = type;
    dragState.draggedItemContent = content;
  }
  // 消災人員
  if (type === "person" && content) {
    dragState.draggedItemType = type;
    dragState.draggedItemContent = content;
  }
  // 超度地址
  if (type === "salvationAddress" && content) {
    dragState.draggedItemType = type;
    dragState.draggedItemContent = content;
  }
  // 祖先
  if (type === "ancestor" && content) {
    dragState.draggedItemType = type;
    dragState.draggedItemContent = content;
  }
  // 陽上人
  if (type === "survivor" && content) {
    dragState.draggedItemType = type;
    dragState.draggedItemContent = content;
  }

  // 設置拖拽效果
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({
      type: dragState.draggedItemType,
      content: dragState.draggedItemContent,
    }),
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
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;

  // 調整坐標到卡片實際顯示區域
  x -= cardDimensions.offsetX;
  y -= cardDimensions.offsetY;

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

  // 調整坐標到卡片實際顯示區域
  newX -= cardDimensions.offsetX;
  newY -= cardDimensions.offsetY;

  // 確保元素不會完全移出卡片顯示區域
  const elementWidth = 150; // 固定寬度
  const elementHeight =
    cardStore.droppedItems.find(
      (item) => item.id === itemDragState.draggingItemId,
    )?.content?.length * 30 || 80;

  // 限制在卡片範圍內
  newX = Math.max(0, Math.min(newX, cardDimensions.width - elementWidth));
  newY = Math.max(0, Math.min(newY, cardDimensions.height - elementHeight));

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

// 列印/下載卡片（使用與 RegistrationPrint.vue 相同的方式）
const handlePrintCard = async () => {
  try {
    printing.value = true;

    // 使用 Element Plus 消息提示
    ElMessage({
      message: "正在生成卡片設計，請稍候...",
      type: "info",
      duration: 2000,
    });

    // 等待下一個渲染周期確保所有元素都已渲染
    await nextTick();

    // 方法1：直接捕捉卡片背景區域（最準確）
    const printElement = document.querySelector(".card-bg");

    // 臨時調整元素位置為絕對定位在卡片上
    const tempAdjustments = [];
    const droppedItems = document.querySelectorAll(".dropped-item");

    console.log("droppedItems", droppedItems);

    // 保存原始位置並調整為相對卡片背景
    droppedItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const cardRect = printElement.getBoundingClientRect();

      // 計算相對位置
      const relativeLeft = rect.left - cardRect.left;
      const relativeTop = rect.top - cardRect.top;

      // 保存原始樣式
      tempAdjustments.push({
        element: item,
        originalLeft: item.style.left,
        originalTop: item.style.top,
        originalPosition: item.style.position,
      });

      // 設置為相對卡片背景的絕對定位
      item.style.position = "absolute";
      item.style.left = `${relativeLeft}px`;
      item.style.top = `${relativeTop}px`;
      item.style.transform = "none"; // 移除transform
    });

    console.log("開始捕捉卡片...", printElement);

    const canvas = await html2canvas(printElement, {
      backgroundColor: null, // 設置為null以保持透明背景
      scale: 2, // 提高分辨率
      useCORS: true,
      allowTaint: true,
      logging: true, // 開啟日誌
      removeContainer: true,
      width: printElement.clientWidth,
      height: printElement.clientHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) => {
        // 忽略不需要的元素
        return (
          element.classList.contains("delete-btn") ||
          element.classList.contains("empty-state")
        );
      },
    });

    // 恢復原始樣式
    tempAdjustments.forEach((adjustment) => {
      if (adjustment.element) {
        adjustment.element.style.left = adjustment.originalLeft;
        adjustment.element.style.top = adjustment.originalTop;
        adjustment.element.style.position = adjustment.originalPosition;
      }
    });

    // 創建下載鏈接
    const link = document.createElement("a");
    link.download = `卡片設計_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    ElMessage({
      message: "卡片設計已下載成功！",
      type: "success",
      duration: 3000,
    });
  } catch (error) {
    console.error("生成圖片時出錯:", error);

    let errorMessage = "生成圖片時出錯，請重試";

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
    //cancelButtonText: "取消",
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

.card-content {
  display: flex;
  min-height: 700px;
  border: 0px solid #000000;
}

.card-container {
  flex: 1;
  border-radius: 0px;
  /* box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.05); */
  position: relative;
  overflow: hidden;
  opacity: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f8f0e3"/><path d="M0,20 L100,20 M0,40 L100,40 M0,60 L100,60 M0,80 L100,80 M20,0 L20,100 M40,0 L40,100 M60,0 L60,100 M80,0 L80,100" stroke="%23e6d8c3" stroke-width="0.5"/></svg>');
  border: 0px solid #000000;
}

/* 左側卡片區域 */
.card-preview {
  flex: 1;
  background-color: #f8f9fa;
  padding: 15px;
  display: flex;
  flex-direction: column;
  border: 0px solid #007bff;
}

/* 右側數據區域 */
.card-data {
  min-width: 350px;
  min-height: 1000px;
  padding: 15px;
  /* background-color: #f9f9f9; */
  overflow-y: auto;
  border: 0px solid #9c27b0;
}

.card-bg {
  width: 100%;
  height: 100%;
  max-width: 600px; /* 限制最大寬度 */
  max-height: 900px; /* 限制最大高度 */
  /* background-image: url("../data/card-template-zk01b.png"); 
  background-size: contain;
  background-repeat: no-repeat; */
  background-position: center; /* 保持居中顯示 */
  position: relative;
  margin: auto; /* 確保居中 */
  border: 0px solid #000000;

  /* 添加 flexbox */
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-bg-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border: 0.5px solid #000111;
}

.drop-zone {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0px solid #000000;
}

.dropped-item {
  position: absolute;
  border: 0px solid rgba(214, 51, 132, 0.3);
  max-width: 150px;
  cursor: move;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  padding: 5px;
}

.dropped-item:hover {
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px dashed #ff4757;
  z-index: 100;
}

.dropped-item.selected {
  box-shadow: 0 0 0 0px rgba(214, 51, 132, 0.2);
}

.delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  opacity: 0;
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 12px;
  cursor: pointer;
  z-index: 101;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 71, 87, 0.8);
}

.delete-btn:hover {
  background-color: #ff4757;
  opacity: 1;
}

.data-section {
  margin-bottom: 10px;
}

.section-title {
  font-size: 24px;
  color: var(--primary-color);
  margin-bottom: 0px;
  border-bottom: 2px solid var(--light-color);
  display: flex;
  align-items: center;
  border: 0px solid #000000;
}

.data-item {
  background-color: white;
  /* border-radius: 8px; */
  padding: 5px;
  /* margin-bottom: 15px; */
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  border: 1px dashed #aaaaaa;
  cursor: grab;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.data-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px dashed #ff4757;
}

.data-item:active {
  cursor: grabbing;
}

.data-value {
  font-size: 1.1rem;
  color: #333;
  font-weight: 500;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.use-help {
  background-color: #e7f3ff;
  border-radius: 8px;
  padding: 18px;
  margin-top: 25px;
  margin-bottom: 25px;
  border-left: 4px solid #007bff;
}

.use-help h3 {
  color: #007bff;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.use-help ul {
  padding-left: 20px;
}

.use-help li {
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  /* border-top: 1px solid #e9ecef; */
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
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

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
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

.btn-outline:disabled {
  border-color: #ccc;
  color: #ccc;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 表單切換器樣式 */
.form-switcher {
  background: #f8f9fa;
  border: 0px solid #e9ecef;
  border-radius: 8px;
  padding: 0rem;
  margin-bottom: 0rem;
}

.form-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.form-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
}

.form-tab:hover {
  border-color: var(--primary-color);
}

.form-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.tab-number {
  font-weight: bold;
}

.tab-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 50px;
  background: #e9ecef;
}

.tab-status.creating {
  background: #fff3cd;
  color: #856404;
}
.tab-status.editing {
  background: #d1ecf1;
  color: #0c5460;
}
.tab-status.saved {
  background: #d4edda;
  color: #155724;
}
.tab-status.submitted {
  background: #d1ecf1;
  color: #0c5460;
}

.tab-close {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-close:hover {
  color: #dc3545;
}

.form-tab-add {
  background: transparent;
  border: 1px dashed #ddd;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.form-tab-add:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .card-content {
    flex-direction: column;
  }

  .card-data {
    width: 100%;
  }

  .button {
    max-width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
