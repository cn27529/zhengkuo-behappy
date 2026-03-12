# 打印開發參考指南

本文檔收集了關於開發特定尺寸 128mm (寬) x 182mm (高) 直式感謝狀的技術調研與實作建議。

## 概述說明

要實現 特定尺寸 128mm (寬) x 182mm (高) 直式收據（感謝狀）如何實現，web程序能處理嗎，看起來這款收據（感謝狀）像是特有尺吋不像A4紙，特有尺吋是否需要特有的信息傳送給打印機，打印機支援打印各種尺吋嗎，若使用打印套件 Print.js (處理 PDF 或 HTML 局部打印)也是可以的嗎。這張收據看起來帶有垂直排版的特性（中文直書）。在 CSS 中，你可以使用 writing-mode: vertical-rl; 來完美實現這種傳統的直式排版。我測量了直式收據，目前收集到的信息：最接近的標準尺寸：JIS B6，標準規格： 128mm (寬) x 182mm (高)。

## 1. 物理規格分析

- **實測尺寸：** 128mm (寬) x 182mm (高)
- **對應標準：** 接近 **JIS B6** 128mm (寬) x 182mm (高) 或台灣印刷規格 **32K**。
- **打印挑戰：** 非標準 A4 尺寸，需在打印機驅動中設定「自定義紙張」。

---

## 2. Web 技術實現 (CSS 核心)

利用 `writing-mode` 實現傳統中文直向排版，並透過 `@page` 精確定義紙張。

### 核心代碼範例：

```css
@media print {
  @page {
    /* 使用實測的物理尺寸 */
    size: 128mm 182mm;
    margin: 0; /* 根據打印機物理邊距調整，通常預留 5mm */
  }

  .print-page-container {
    display: flex;
    min-height: 100vh;
    background-color: #333;
  }

  /* 核心畫布區域 */
  .receipt-content {
    background: #ffffff;
    padding: 0;
    line-height: 0;
  }

  .receipt-canvas {
    width: 128mm;
    height: 182mm;
    padding: 12mm 10mm;
    box-sizing: border-box;
    position: relative;
    writing-mode: vertical-rl;
    -webkit-writing-mode: vertical-rl;
    border: 0.2pt solid #333;
    background-color: #ffffff;
  }
}
```

### 感謝狀打印測試

```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <title>感謝狀打印測試</title>
    <style>
      /* 定義打印區域 */
      @media screen {
        body {
          background: #e0e0e0;
          display: flex;
          justify-content: center;
          padding: 20px;
        }
        .receipt-canvas {
          background: #ffcce6; /* 模擬粉紅色收據底色 */
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
      }

      @media print {
        @page {
          /* 這裡定義實際紙張尺寸，例如 150mm 寬, 210mm 高 */
          size: 150mm 210mm;
          margin: 0;
        }
        body {
          background: none;
        }
        .receipt-canvas {
          box-shadow: none;
        }
      }

      .print-page-container {
        display: flex;
        min-height: 100vh;
        background-color: #333;
      }

      /* 核心畫布區域 */
      .receipt-content {
        background: #ffffff;
        padding: 0;
        line-height: 0;
      }

      /* 收據主體 */
      .receipt-canvas {
        width: 128mm;
        height: 182mm;
        padding: 12mm 10mm;
        box-sizing: border-box;
        position: relative;
        writing-mode: vertical-rl;
        -webkit-writing-mode: vertical-rl;
        border: 0.2pt solid #333;
        background-color: #ffffff;
      }

      h1 {
        font-size: 32pt;
        text-align: center;
        letter-spacing: 10px;
        margin-left: 20px;
      }

      .content-section {
        font-size: 16pt;
        height: 100%;
      }

      .highlight {
        font-size: 18pt;
        font-weight: bold;
        text-decoration: underline;
      }

      .footer-info {
        position: absolute;
        bottom: 20mm;
        left: 15mm;
        writing-mode: horizontal-tb; /* 底部日期或流水號可轉回橫向 */
        font-size: 12pt;
      }

      .temple-info {
        margin-right: auto;
        border-right: 1px solid #333;
        padding-right: 10px;
      }
    </style>
  </head>
  <body>
    <div class="receipt-canvas">
      <h1>感謝狀</h1>

      <div class="content-section">
        兹收到 <span class="highlight">黃洧析</span> 大德<br />
        功德項目：點燈(1200)、新春法會(1000)<br />
        共計新台幣：貳仟貳佰元整<br />
        住址：彰化縣員林市新生路...<br />
        功德無量，特此致謝
      </div>

      <div class="temple-info">
        鎮國寺<br />
        地址：南投縣集集鎮...<br />
        電話：(049) 2762726<br />
        經手人：釋徹空
      </div>

      <div class="footer-info">中華民國 115 年 2 月 17 日</div>
    </div>
  </body>
</html>
```
