// ========== 布林值工具函數 ==========

// 將多種布林/數字字串規格統一為 boolean
export const normalizeBool = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
};

/**
 * 布林值工具函數集合
 * 提供統一的布林值處理接口
 */
export const BoolUtils = Object.freeze({
  normalizeBool
});
