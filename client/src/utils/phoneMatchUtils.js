// 輔助函式：處理電話模糊匹配
const fuzzyPhoneMatch = (target, query) => {
  if (!target || !query) return false;
  const cleanTarget = target.replace(/\D/g, "");
  const cleanQuery = query.replace(/\D/g, "");
  // 如果搜尋字串包含數字，則比對純數字；否則退回原始字串比對
  return cleanQuery !== ""
    ? cleanTarget.includes(cleanQuery)
    : target.includes(query);
};
