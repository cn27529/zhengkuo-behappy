// ========== 日期時間工具函數 ==========

import { de } from "element-plus/es/locale/index.mjs";

/**
 * 獲取當前時間的 ISO 格式字符串
 * @returns {string} ISO 格式時間字符串
 */
export const getCurrentISOTime = () => new Date().toISOString();

/**
 * 格式化日期為 YYYY-MM-DD 格式
 * @param {Date|string} date - 日期
 * @returns {string} 格式化後的日期字符串
 */
export const formatDateYMD = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * 格式化日期為本地化格式（2024/12/08）
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化後的日期字符串
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      //hour: "2-digit",
      //minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

/**
 * 格式化日期為長格式（2024年12月8日）
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化後的日期字符串
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }

  // if (!dateString) return "-";
  // try {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("zh-TW", {
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //   });
  // } catch {
  //   return dateString;
  // }
};

/**
 * 格式化時間為 HH:mm 格式
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化後的時間字符串
 */
export const formatTime = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

/**
 * 格式化日期時間為 YYYY-MM-DD HH:mm 格式
 * @param {Date|string} date - 日期時間
 * @returns {string} 格式化後的日期時間字符串
 */
export const formatDateTimeYMD = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * 格式化日期時間為本地化格式（2024/12/08 14:30）
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化後的日期時間字符串
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

/**
 * 計算一年前的日期
 * @returns {Date} 一年前的日期
 */
export const getOneYearAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
};

/**
 * 計算 N 個月前的日期
 * @param {number} months - 月數
 * @returns {Date} N 個月前的日期
 */
export const getMonthsAgo = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};

/**
 * 檢查日期是否在指定時間範圍內
 * @param {string} dateString - 日期字符串
 * @param {number} months - 月份範圍（預設 12 個月）
 * @returns {boolean} 是否在範圍內
 */
export const isWithinMonths = (dateString, months = 12) => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  const cutoffDate = getMonthsAgo(months);
  return targetDate >= cutoffDate;
};

/**
 * 檢查日期是否為有效日期
 * @param {string} dateString - 日期字符串
 * @returns {boolean} 是否有效
 */
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export const DateUtils = {
  getCurrentISOTime,
  formatDateYMD,
  formatDate,
  formatDateLong,
  formatTime,
  formatDateTime,
  formatDateTimeYMD,
  getOneYearAgo,
  getMonthsAgo,
  isWithinMonths,
  isValidDate,
};
