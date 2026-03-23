// src/stores/joinRecordPrintStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { joinRecordService } from "../services/joinRecordService.js";

export const useJoinRecordPrintStore = defineStore("joinRecordPrint", () => {
  // --- State ---
  const isUpdating = ref(false);
  const lastUpdateResult = ref(null);

  // --- Actions ---

  /**
   * 更新收據打印狀態
   * @param {Object} record      - 要更新的記錄
   * @param {string|null} source - 導航來源，例如 'joinRecord'，由呼叫端傳入
   */
  const updateReceiptPrintStatus = async (record, source = null) => {
    isUpdating.value = true;
    lastUpdateResult.value = null;

    try {
      const result = await joinRecordService.updateByReceiptPrint(record);
      lastUpdateResult.value = result;

      // 打印完成後，同步回寫對應的上游 store 快取
      if (source && result?.success) {
        await _syncUpstreamStore(source, result);
      }

      return result;
    } catch (error) {
      console.error("更新收據打印狀態失敗:", error);
      lastUpdateResult.value = {
        success: false,
        message: error.message || "更新失敗",
      };
      return lastUpdateResult.value;
    } finally {
      isUpdating.value = false;
    }
  };

  /**
   * 同步回寫上游 store 的 savedRecords 快取
   * 避免打印後側邊欄的收據號、經手人等欄位仍顯示舊值
   *
   * 使用動態 import 避免 joinRecordStore <-> joinRecordPrintStore 的循環依賴
   */
  const _syncUpstreamStore = async (source, result) => {
    const data = result?.data;

    // 防衛：若 API 回傳的必要欄位不完整，略過同步
    if (!data?.id || !data?.receiptIssuedAt || !data?.receiptIssuedBy) {
      console.warn(
        "[joinRecordPrintStore] _syncUpstreamStore: result.data 欄位不完整，略過同步",
        data,
      );
      return;
    }

    if (source === "joinRecord") {
      // 動態 import 避免循環依賴，Pinia store 在 setup 後已初始化，此處呼叫安全
      const { useJoinRecordStore } = await import("./joinRecordStore.js");
      const joinRecordStore = useJoinRecordStore();

      const index = joinRecordStore.savedRecords.findIndex(
        (r) => r.id === data.id,
      );

      if (index !== -1) {
        // 只更新收據相關欄位，保留其他欄位不變
        joinRecordStore.savedRecords[index] = {
          ...joinRecordStore.savedRecords[index],
          receiptNumber: data.receiptNumber,
          receiptIssued: data.receiptIssued,
          receiptIssuedAt: data.receiptIssuedAt,
          receiptIssuedBy: data.receiptIssuedBy,
        };
        console.log(
          `[joinRecordPrintStore] 已同步 joinRecord.savedRecords[${index}]`,
          joinRecordStore.savedRecords[index],
        );
      } else {
        console.warn(
          `[joinRecordPrintStore] 找不到 id=${data.id} 的 savedRecord，無法同步`,
        );
      }
    }

    // 未來若有其他來源（例如 'memberRecord'），在此新增 else if 分支
  };

  const resetState = () => {
    isUpdating.value = false;
    lastUpdateResult.value = null;
  };

  // --- Expose ---
  return {
    // State
    isUpdating,
    lastUpdateResult,
    // Actions
    updateReceiptPrintStatus,
    resetState,
    // _syncUpstreamStore 是內部方法，不對外暴露
  };
});
