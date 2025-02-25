const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto("https://fill.dev/form/credit-card-simple", { waitUntil: "networkidle2" });

    await page.waitForSelector("#cc-name");
    await page.type("#cc-name", "Bhavya Dabas");

    await page.waitForSelector("#cc-type");
    await page.select("#cc-type", "visa");

    await page.waitForSelector("#cc-number");
    await page.type("#cc-number", "4111111111111111");

    await page.waitForSelector("#cc-csc");
    await page.type("#cc-csc", "123");

    await page.waitForSelector("#cc-exp-month");
    await page.select("#cc-exp-month", "12");

    await page.waitForSelector("#cc-exp-year");
    await page.select("#cc-exp-year", "2028");

    await page.waitForSelector("button[type='submit']");
    await page.click("button[type='submit']");

    console.log("✅ Form filled and submitted!");

    // ✅ FIX: Use a proper delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    await browser.close();
}

run().catch(console.error);
