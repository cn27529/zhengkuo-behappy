const puppeteer = require("puppeteer");

async function quickBooking() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  try {
    const doctorCode = "0055881";

    console.log("🔍 正在檢查掛號頁面...");
    await page.goto(
      "https://bc.cch.org.tw/BCRG/opd/service-e.aspx?id=0900&Page=11&#p",
    );

    await page.waitForSelector("select");

    // 獲取日期選項
    const dates = await page.$$eval("select option", (options) =>
      options
        .slice(1)
        .map((opt) => ({ value: opt.value, text: opt.textContent })),
    );

    for (const date of dates) {
      console.log(`檢查 ${date.text}...`);

      await page.select("select", date.value);
      await page.waitForTimeout(2000);

      const doctorLink = await page.$(`a[href*="dr_no=${doctorCode}"]`);

      if (doctorLink) {
        console.log(`✅ 找到${doctorCode}劉又綾醫師！正在掛號...`);

        await doctorLink.click();
        await page.waitForNavigation();

        // 自動填寫表單
        await page.waitForTimeout(2000);

        const textInputs = await page.$$('input[type="text"]');

        if (textInputs.length >= 1) {
          await textInputs[0].type("P200289819");
          console.log(`✅ 填寫病歷號: P200289819`);
        }

        if (textInputs.length >= 2) {
          await textInputs[1].type("0706");
          console.log(`✅ 填寫生日: 0706`);
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

        await page.waitForSelector("#Table3");
        await page.click("#BtOK");

        console.log("🎉 掛號提交完成！請檢查結果");
        await page.waitForTimeout(5000);

        // 保持瀏覽器開啟讓您檢查結果
        console.log("瀏覽器將保持開啟，請檢查掛號結果...");
        return; // 找到並提交後保持開啟
      }
    }

    // 沒找到可掛號時段，自動關閉
    console.log("❌ 本次檢查未找到可掛號時段，程序結束");
    await browser.close();
  } catch (error) {
    console.error("錯誤:", error);
    await browser.close();
  }
}

quickBooking();
