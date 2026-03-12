// client/src/utils/receiptUtils.js

/**
 * 收據相關的輔助工具函數
 *
 * 用於處理 needReceipt 欄位的新舊格式轉換和驗證
 *
 * 舊格式: boolean (true/false) 或 string ("true"/"false"/"0"/"1")
 * 新格式: string ("" | "standard" | "stamp")
 *
 * @module receiptUtils
 */

export const ReceiptUtils = {
  /**
   * 收據類型常量
   */
  RECEIPT_TYPES: {
    NONE: "",
    STANDARD: "standard", // 感謝狀
    STAMP: "stamp", // 收據
  },

  /**
   * 標準化 needReceipt 值
   * 處理舊的 boolean 值和新的 string 值
   *
   * @param {any} value - 原始值
   * @returns {string} 標準化後的值: "" | "standard" | "stamp"
   *
   * @example
   * normalizeNeedReceipt(true)        // => "standard"
   * normalizeNeedReceipt("true")      // => "standard"
   * normalizeNeedReceipt("1")         // => "standard"
   * normalizeNeedReceipt(false)       // => ""
   * normalizeNeedReceipt("false")     // => ""
   * normalizeNeedReceipt("0")         // => ""
   * normalizeNeedReceipt("standard")  // => "standard"
   * normalizeNeedReceipt("stamp")     // => "stamp"
   * normalizeNeedReceipt(null)        // => ""
   * normalizeNeedReceipt(undefined)   // => ""
   */
  normalizeNeedReceipt(value) {
    // 處理 null 和 undefined
    if (value === null || value === undefined) {
      return this.RECEIPT_TYPES.NONE;
    }

    // 處理舊的 boolean 值
    if (
      value === true ||
      value === "true" ||
      value === "1" ||
      value === "TRUE"
    ) {
      return this.RECEIPT_TYPES.STANDARD; // 預設轉換為感謝狀
    }

    // 處理 false 值
    if (
      value === false ||
      value === "false" ||
      value === "0" ||
      value === "FALSE" ||
      value === ""
    ) {
      return this.RECEIPT_TYPES.NONE;
    }

    // 處理新的字串值
    if (
      value === this.RECEIPT_TYPES.STANDARD ||
      value === this.RECEIPT_TYPES.STAMP
    ) {
      return value;
    }

    // 預設返回空字串
    console.warn(`⚠️ 未知的 needReceipt 值: ${value}，返回空字串`);
    return this.RECEIPT_TYPES.NONE;
  },

  /**
   * 檢查是否需要收據（任何類型）
   *
   * @param {string} value - needReceipt 值
   * @returns {boolean} 是否需要收據
   *
   * @example
   * isNeedReceipt("")         // => false
   * isNeedReceipt("standard") // => true
   * isNeedReceipt("stamp")    // => true
   * isNeedReceipt(true)       // => true (舊格式)
   */
  isNeedReceipt(value) {
    const normalized = this.normalizeNeedReceipt(value);
    return (
      normalized === this.RECEIPT_TYPES.STANDARD ||
      normalized === this.RECEIPT_TYPES.STAMP
    );
  },

  /**
   * 檢查是否需要感謝狀
   *
   * @param {string} value - needReceipt 值
   * @returns {boolean}
   */
  isStandard(value) {
    const normalized = this.normalizeNeedReceipt(value);
    return normalized === this.RECEIPT_TYPES.STANDARD;
  },

  /**
   * 檢查是否需要收據
   *
   * @param {string} value - needReceipt 值
   * @returns {boolean}
   */
  isStamp(value) {
    const normalized = this.normalizeNeedReceipt(value);
    return normalized === this.RECEIPT_TYPES.STAMP;
  },

  /**
   * 獲取收據類型標籤（中文）
   *
   * @param {string} value - needReceipt 值
   * @returns {string} 中文標籤
   *
   * @example
   * getReceiptTypeLabel("")         // => "不需要"
   * getReceiptTypeLabel("standard") // => "感謝狀"
   * getReceiptTypeLabel("stamp")    // => "收據"
   */
  getReceiptTypeLabel(value) {
    const normalized = this.normalizeNeedReceipt(value);
    const labels = {
      [this.RECEIPT_TYPES.NONE]: "不需要",
      [this.RECEIPT_TYPES.STANDARD]: "感謝狀",
      [this.RECEIPT_TYPES.STAMP]: "收據",
    };
    return labels[normalized] || "不需要";
  },

  /**
   * 獲取收據類型選項（用於下拉選單）
   *
   * @returns {Array<{value: string, label: string}>}
   */
  getReceiptTypeOptions() {
    return [
      { value: this.RECEIPT_TYPES.NONE, label: "不需要" },
      { value: this.RECEIPT_TYPES.STANDARD, label: "感謝狀" },
      { value: this.RECEIPT_TYPES.STAMP, label: "收據" },
    ];
  },

  /**
   * 驗證 needReceipt 值是否有效
   *
   * @param {string} value - 要驗證的值
   * @returns {boolean} 是否有效
   */
  isValidReceiptType(value) {
    const validTypes = [
      this.RECEIPT_TYPES.NONE,
      this.RECEIPT_TYPES.STANDARD,
      this.RECEIPT_TYPES.STAMP,
    ];
    return validTypes.includes(value);
  },

  /**
   * 根據 activeTemplate 獲取 needReceipt 值
   *
   * @param {string} activeTemplate - 活動模版類型
   * @returns {string} needReceipt 值
   *
   * @example
   * getReceiptTypeFromTemplate("standard") // => "standard"
   * getReceiptTypeFromTemplate("stamp")    // => "stamp"
   * getReceiptTypeFromTemplate("other")    // => ""
   */
  getReceiptTypeFromTemplate(activeTemplate) {
    if (activeTemplate === "standard") {
      return this.RECEIPT_TYPES.STANDARD;
    }
    if (activeTemplate === "stamp") {
      return this.RECEIPT_TYPES.STAMP;
    }
    return this.RECEIPT_TYPES.NONE;
  },

  /**
   * 批量標準化資料
   * 用於資料遷移或批量處理
   *
   * @param {Array<Object>} records - 記錄陣列
   * @returns {Array<Object>} 標準化後的記錄陣列
   */
  normalizeRecords(records) {
    if (!Array.isArray(records)) {
      console.warn("⚠️ normalizeRecords: 輸入不是陣列");
      return [];
    }

    return records.map((record) => ({
      ...record,
      needReceipt: this.normalizeNeedReceipt(record.needReceipt),
    }));
  },

  /**
   * 獲取收據類型的顏色標籤（用於 UI 顯示）
   *
   * @param {string} value - needReceipt 值
   * @returns {Object} { type: string, color: string }
   */
  getReceiptTypeTag(value) {
    const normalized = this.normalizeNeedReceipt(value);
    const tags = {
      [this.RECEIPT_TYPES.NONE]: { type: "info", color: "#909399" },
      [this.RECEIPT_TYPES.STANDARD]: { type: "success", color: "#67C23A" },
      [this.RECEIPT_TYPES.STAMP]: { type: "primary", color: "#409EFF" },
    };
    return tags[normalized] || tags[this.RECEIPT_TYPES.NONE];
  },
};

/**
 * 導出常量供外部使用
 */
export const RECEIPT_TYPES = ReceiptUtils.RECEIPT_TYPES;

/**
 * 導出常用函數的簡寫
 */
export const normalizeNeedReceipt =
  ReceiptUtils.normalizeNeedReceipt.bind(ReceiptUtils);
export const isNeedReceipt = ReceiptUtils.isNeedReceipt.bind(ReceiptUtils);
export const getReceiptTypeLabel =
  ReceiptUtils.getReceiptTypeLabel.bind(ReceiptUtils);
