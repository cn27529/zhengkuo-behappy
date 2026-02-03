const puppeteer = require("puppeteer");
const cron = require("node-cron");

class BCCHBooking {
  constructor() {
    this.config = {
      doctorName: "劉又綾",
      doctorCode: "0055881", // 劉又綾醫師的正確代碼
      patientId: "P200289819",
      birthday: "0706",
      baseUrl:
        "https://bc.cch.org.tw/BCRG/opd/service-e.aspx?id=0900&Page=11&#p",
    };
  }

  async tryBooking() {
    // 詢問運行模式
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("請選擇運行模式:");
    console.log("1. 依日期選擇可用的醫師");
    console.log("2. 依config自動尋找劉又綾醫師");

    const mode = await new Promise((resolve) => {
      rl.question("請輸入選擇 (1 或 2，按 Enter 結束): ", (answer) => {
        rl.close();
        if (answer.trim() === "") {
          console.log("👋 程序已取消");
          process.exit(0);
        }
        resolve(answer);
      });
    });

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

      console.log(`找到 ${dates.length} 個可選日期`);

      for (const date of dates) {
        console.log(`檢查日期: ${date.text}`);

        // 選擇日期
        await page.select("select", date.value);
        await page.waitForTimeout(2000); // 等待頁面刷新

        // 列出所有醫師連結
        const doctorLinks = await page.$$eval('a[href*="dr_no="]', (links) =>
          links.map((link) => ({
            text: link.textContent.trim(),
            href: link.href,
            doctorCode: link.href.match(/dr_no=([^&]+)/)?.[1],
          })),
        );

        if (mode === "1") {
          // 模式1: 讓用戶選擇醫師
          if (doctorLinks.length > 0) {
            console.log("可用醫師:");
            doctorLinks.forEach((doctor, index) => {
              console.log(
                `${index + 1}. ${doctor.text} (代碼: ${doctor.doctorCode})`,
              );
            });

            const readline2 = require("readline");
            const rl2 = readline2.createInterface({
              input: process.stdin,
              output: process.stdout,
            });

            const choice = await new Promise((resolve) => {
              rl2.question("請選擇醫師 (輸入數字): ", (answer) => {
                rl2.close();
                resolve(parseInt(answer) - 1);
              });
            });

            const selectedDoctor = doctorLinks[choice];

            if (selectedDoctor) {
              console.log(
                `選擇了 ${selectedDoctor.text} 醫師，進入掛號頁面...`,
              );

              const doctorLink = await page.$(
                `a[href*="dr_no=${selectedDoctor.doctorCode}"]`,
              );
              await doctorLink.click();
              await page.waitForNavigation({ waitUntil: "networkidle2" });

              await this.fillBookingForm(page);

              console.log("✅ 已自動填寫表單，請檢查並手動提交");
              console.log("💡 按 Ctrl+C 可結束程序");

              await new Promise(() => {}); // 無限等待
              return true;
            }
          }
        } else {
          // 模式2: 自動尋找劉又綾醫師
          const targetDoctor = doctorLinks.find(
            (doctor) => doctor.doctorCode === this.config.doctorCode,
          );

          if (targetDoctor) {
            console.log(
              `找到 ${targetDoctor.text} 醫師 (代碼: ${targetDoctor.doctorCode})，進入掛號頁面...`,
            );

            const doctorLink = await page.$(
              `a[href*="dr_no=${targetDoctor.doctorCode}"]`,
            );
            await doctorLink.click();
            await page.waitForNavigation({ waitUntil: "networkidle2" });

            // 自動填寫表單
            await this.fillBookingForm(page);

            console.log("✅ 已自動填寫表單，請檢查並手動提交");
            console.log("💡 按 Ctrl+C 可結束程序");

            // 保持瀏覽器開啟，等待用戶操作
            await new Promise(() => {}); // 無限等待
            return true;
          } else {
            console.log(
              `未找到醫師代碼 ${this.config.doctorCode} 的 ${this.config.doctorName}醫師`,
            );
          }
        }
      }

      console.log("本次檢查未找到可掛號時段");
      return false;
    } catch (error) {
      console.error("掛號過程發生錯誤:", error);
      return false;
    } finally {
      await browser.close();
    }
  }

  async fillBookingForm(page) {
    try {
      // 等待頁面載入
      await page.waitForTimeout(2000);

      // 先列出所有輸入框供調試
      const inputs = await page.$$eval("input, select", (elements) =>
        elements.map((el, index) => ({
          index,
          tagName: el.tagName,
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          value: el.value,
          className: el.className,
        })),
      );

      console.log("頁面上的所有輸入框:", JSON.stringify(inputs, null, 2));

      // 嘗試按順序填寫前幾個 text 輸入框
      const textInputs = await page.$$('input[type="text"]');

      if (textInputs.length >= 1) {
        await textInputs[0].type(this.config.patientId);
        console.log(`✅ 填寫第1個輸入框 (病歷號): ${this.config.patientId}`);
      }

      if (textInputs.length >= 2) {
        await textInputs[1].type(this.config.birthday);
        console.log(`✅ 填寫第2個輸入框 (生日): ${this.config.birthday}`);
      }

      // 嘗試選擇下拉選單
      const selects = await page.$$("select");
      if (selects.length > 0) {
        const options = await page.$$eval("select option", (opts) =>
          opts.map((opt) => ({ value: opt.value, text: opt.textContent })),
        );
        console.log("下拉選單選項:", options);

        if (options.length > 1) {
          await page.select("select", options[1].value); // 選擇第二個選項
          console.log(`✅ 選擇掛號類別: ${options[1].text}`);
        }
      }
    } catch (error) {
      console.log("填寫表單時發生錯誤:", error.message);
    }
  }

  async checkBookingResult(page) {
    try {
      // 檢查是否有成功訊息或錯誤訊息
      const successMsg = await page.$eval("body", (el) => el.textContent);
      return successMsg.includes("成功") || successMsg.includes("完成");
    } catch {
      return false;
    }
  }

  startScheduler() {
    console.log("🚀 啟動自動掛號系統...");
    console.log("⏰ 每天 08:00, 12:00, 18:00 自動檢查掛號");

    // 每天 8:00, 12:00, 18:00 執行
    cron.schedule("0 8,12,18 * * *", () => {
      console.log(`\n[${new Date().toLocaleString()}] 開始自動掛號檢查...`);
      this.tryBooking();
    });

    // 立即執行一次
    this.tryBooking().then((result) => {
      if (!result) {
        // 如果沒找到可掛號時段，結束程序
        console.log("👋 自動掛號系統已停止");
        process.exit(0);
      }
    });
  }
}

// 啟動自動掛號系統
const booking = new BCCHBooking();
booking.startScheduler();

// 保持程序運行
process.on("SIGINT", () => {
  console.log("\n👋 自動掛號系統已停止");
  process.exit(0);
});
