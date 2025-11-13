// src/utils/mockDataHelper.js
import mockRegistrations from "../data/mock_registrations.json";

export class MockDataHelper {
  // 獲取隨機一筆報名數據
  static getRandomRegistration() {
    const randomIndex = Math.floor(Math.random() * mockRegistrations.length);
    return mockRegistrations[randomIndex];
  }

  // 將報名數據轉換為 Mydata 格式
  static convertToMydataFormat(registration) {
    return {
      formName: registration.formName,
      state: registration.state,
      contact: {
        name: registration.contact.name,
        phone: registration.contact.phone,
        mobile: registration.contact.mobile,
        relationship: registration.contact.relationship,
        otherRelationship: registration.contact.otherRelationship || "",
      },
    };
  }

  // 直接獲取隨機的 Mydata 格式數據
  static getRandomMydata() {
    const randomRegistration = this.getRandomRegistration();
    return this.convertToMydataFormat(randomRegistration);
  }

  // 獲取所有可用的表單名稱（用於選擇）
  static getAllFormNames() {
    return mockRegistrations.map((item) => item.formName);
  }

  // 根據表單名稱獲取特定數據
  static getRegistrationByFormName(formName) {
    return mockRegistrations.find((item) => item.formName === formName);
  }
}

export default MockDataHelper;
