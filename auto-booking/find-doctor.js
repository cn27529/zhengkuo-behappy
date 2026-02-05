const puppeteer = require("puppeteer");

class DoctorFinder {
  constructor() {
    this.config = {
      doctorName: "劉又綾", //
      doctorCode: "0055881", // 劉又綾 0055881, 黃雅琪 0147226, 邱欣玲 0063040
      patientId: "P200289819", //P200289819
      birthday: "0706",
      baseUrl:
        "https://bc.cch.org.tw/BCRG/opd/service-e.aspx?id=0900&Page=11&#p",
      autoSubmit: true,
      sendMailTo: "cn27529@gmail.com",
      mailSubject: "幫媽媽自動掛號系統",
      mailFrom: "cn27529@gmail.com",
    };
  }

  async findDoctor() {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    try {
      const page = await browser.newPage();
      await page.goto(this.config.baseUrl, { waitUntil: "networkidle2" });

      // 等待日期選擇器載入
      await page.waitForSelector("select");

      // 獲取所有可選日期
      const dates = await page.$$eval("select option", (options) =>
        options
          .slice(1)
          .map((opt) => ({ value: opt.value, text: opt.textContent })),
      );

      console.log(
        `🔍 搜尋 ${this.config.doctorName} 醫師，共 ${dates.length} 個日期範圍`,
      );

      for (const date of dates) {
        console.log(`檢查日期: ${date.text}`);

        // 選擇日期
        await page.select("select", date.value);
        await page.waitForTimeout(2000);

        // 獲取該日期的所有醫師
        const doctorLinks = await page.$$eval('a[href*="dr_no="]', (links) =>
          links.map((link) => ({
            text: link.textContent.trim(),
            href: link.href,
            doctorCode: link.href.match(/dr_no=([^&]+)/)?.[1],
          })),
        );

        // 尋找劉又綾醫師
        const targetDoctor = doctorLinks.find((doctor) =>
          doctor.text.includes(this.config.doctorName),
        );

        if (targetDoctor) {
          console.log(`🎉 找到 ${this.config.doctorName} 醫師！`);
          console.log(`日期範圍: ${date.text}`);
          console.log(`醫師代碼: ${targetDoctor.doctorCode}`);
          console.log(`完整資訊: ${targetDoctor.text}`);

          // 進入掛號頁面
          const doctorLink = await page.$(
            `a[href*="dr_no=${targetDoctor.doctorCode}"]`,
          );
          await doctorLink.click();
          await page.waitForNavigation({ waitUntil: "networkidle2" });

          // 自動填寫表單
          await this.fillBookingForm(page);

          console.log("✅ 已自動填寫表單，請檢查並手動提交");
          console.log("💡 按 Ctrl+C 可結束程序");

          // 保持瀏覽器開啟
          await new Promise(() => {});
          return;
        }
      }

      console.log(`❌ 在所有日期範圍內都未找到 ${this.config.doctorName} 醫師`);
      console.log("程序結束");
    } catch (error) {
      console.error("搜尋過程發生錯誤:", error);
      console.log("程序結束");
    } finally {
      await browser.close(); // 自動關閉瀏覽器
      process.exit(0); // 強制退出程序
    }
  }

  async fillBookingForm(page) {
    try {
      await page.waitForTimeout(2000);

      const textInputs = await page.$$('input[type="text"]');

      if (textInputs.length >= 1) {
        await textInputs[0].type(this.config.patientId);
        console.log(`✅ 填寫病歷號: ${this.config.patientId}`);
      }

      if (textInputs.length >= 2) {
        await textInputs[1].type(this.config.birthday);
        console.log(`✅ 填寫生日: ${this.config.birthday}`);
      }

      const selects = await page.$$("select");
      if (selects.length > 0) {
        const options = await page.$$eval("select option", (opts) =>
          opts.map((opt) => ({ value: opt.value, text: opt.textContent })),
        );

        if (options.length > 1) {
          await page.select("select", options[1].value);
          console.log(`✅ 選擇掛號類別: ${options[1].text}`);
        }
      }
    } catch (error) {
      console.log("填寫表單時發生錯誤:", error.message);
    }
  }
}

// 執行搜尋
const finder = new DoctorFinder();
finder.findDoctor();

process.on("SIGINT", () => {
  console.log("\n👋 搜尋程序已停止");
  process.exit(0);
});
