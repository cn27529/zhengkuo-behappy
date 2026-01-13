// src/services/joinActivityRecordService.js
export const joinActivityRecordService = {
  // 取得初始資料
  async getRegistrations() {
    try {
      // 這裡未來對接 API: return await axios.get('/api/registrations');
      return [];
    } catch (error) {
      console.error("取得登記表失敗", error);
      throw error;
    }
  },

  // 儲存記錄
  async saveRecord(payload) {
    try {
      console.log("Service 傳送資料:", payload);
      // return await axios.post('/api/save-record', payload);
      return { success: true };
    } catch (error) {
      console.error("儲存失敗", error);
      throw error;
    }
  },
};
