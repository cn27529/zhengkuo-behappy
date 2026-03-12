// templates.js - HTML 模版處理模組
const fs = require("fs");
const path = require("path");

class TemplateEngine {
  constructor(templatesDir = path.join(__dirname, "public")) {
    this.templatesDir = templatesDir;
    this.cache = new Map();
  }

  /**
   * 載入模版文件
   * @param {string} templateName - 模版文件名
   * @returns {string} 模版內容
   */
  loadTemplate(templateName) {
    if (this.cache.has(templateName)) {
      return this.cache.get(templateName);
    }

    try {
      const templatePath = path.join(this.templatesDir, templateName);
      const content = fs.readFileSync(templatePath, "utf8");
      this.cache.set(templateName, content);
      return content;
    } catch (error) {
      console.error(`❌ 載入模版失敗: ${templateName}`, error);
      return null;
    }
  }

  /**
   * 渲染模版
   * @param {string} templateName - 模版文件名
   * @param {object} data - 要替換的數據
   * @returns {string} 渲染後的 HTML
   */
  render(templateName, data = {}) {
    const template = this.loadTemplate(templateName);
    if (!template) {
      return `<h1>模版載入失敗: ${templateName}</h1>`;
    }

    let rendered = template;

    // 替換模版變數 {{variable}}
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      rendered = rendered.replace(regex, data[key] || "");
    });

    return rendered;
  }

  /**
   * 清除模版緩存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 重新載入特定模版
   * @param {string} templateName - 模版文件名
   */
  reloadTemplate(templateName) {
    this.cache.delete(templateName);
    return this.loadTemplate(templateName);
  }
}

// 創建全局模版引擎實例
const templateEngine = new TemplateEngine();

module.exports = {
  TemplateEngine,
  templateEngine,
};
