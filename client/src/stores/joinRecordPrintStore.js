// src/stores/joinRecordPrintStore.js
import { defineStore } from "pinia";
import { joinRecordService } from "../services/joinRecordService.js";

export const useJoinRecordPrintStore = defineStore("joinRecordPrint", {
  state: () => ({
    isUpdating: false,
    lastUpdateResult: null,
  }),

  actions: {
    /**
     * 更新收據打印狀態
     */
    async updateReceiptPrintStatus(record) {
      this.isUpdating = true;
      this.lastUpdateResult = null;

      try {
        // // 如果 record 中 receiptIssuedAt, receiptIssuedBy 已經有值，則不再更新
        // if (record.receiptIssuedAt && record.receiptIssuedBy) {
        //   this.lastUpdateResult = {
        //     success: true,
        //     message: `收據打印狀態已存在，保持原始打印記錄不做更新。issuedAt: ${record.receiptIssuedAt}, issuedBy: ${record.receiptIssuedBy}`,
        //   };
        //   return this.lastUpdateResult;
        // }

        const result = await joinRecordService.updateByReceiptPrint(record);
        this.lastUpdateResult = result;

        return result;
      } catch (error) {
        console.error("更新收據打印狀態失敗:", error);
        this.lastUpdateResult = {
          success: false,
          message: error.message || "更新失敗",
        };
        return this.lastUpdateResult;
      } finally {
        this.isUpdating = false;
      }
    },

    /**
     * 重置狀態
     */
    resetState() {
      this.isUpdating = false;
      this.lastUpdateResult = null;
    },
  },
});
