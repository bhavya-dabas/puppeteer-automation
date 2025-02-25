const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

let url_16 = "https://www.apple.com/shop/buy-iphone/iphone-16";

async function getPage() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    // Set a realistic user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    // Capture console log from browser
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    return { browser, page };
}

async function start() {
    let { browser, page } = await getPage();
    try {
        await page.goto(url_16, { waitUntil: 'networkidle0', timeout: 30000 });
        await addToCart(page);
        await shipping(page);
        await payment(page);
    } catch (error) {
        console.error('Error during execution:', error);
    } finally {
        await browser.close();
    }
}

start();

async function addToCart(page) {
    await smart_click_with_pause(page, "input[data-autom='dimensionScreensize6_1inch']", 950);
    await smart_click_with_pause(page, "input[data-autom='dimensionColorteal']", 800);
    await smart_click_with_pause(page, "input[data-autom='dimensionCapacity128gb']", 800);
    await smart_click_with_pause(page, "input[data-autom='choose-noTradeIn']", 1000);
    await smart_click_with_pause(page, "input[data-autom='purchaseGroupOptionfullprice']", 1000);
    await smart_click_with_pause(page, "input[data-autom='carrierModelUNLOCKED/US']", 1000);
    await smart_click_with_pause(page, "input[data-autom='applecareplus_58_noapplecare']", 1000);

    // Click "Add to Cart" and wait for navigation
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
        smart_click_with_pause(page, "button[data-autom='add-to-cart']", 1000)
    ]);

    // Debugging: Take a screenshot and log page content after clicking "Add to Cart"
    await page.screenshot({ path: 'after_add_to_cart.png' });
    console.log('Page content after Add to Cart:', await page.content());

    // Handle the "proceed" button with error catching
    try {
        await smart_click_with_pause(page, "button[data-autom='proceed']", 1000);
    } catch (error) {
        console.log('Error at proceed button:', error.message);
        await page.screenshot({ path: 'error_at_proceed.png' });
        // Attempt alternative selector if "proceed" fails
        try {
            await smart_click_with_pause(page, "button[data-autom='proceed-to-checkout']", 1000);
        } catch (e) {
            console.log('Alternative proceed button also failed:', e.message);
        }
    }

    await smart_click_with_pause(page, "button[data-autom='checkout']", 1000);
    await smart_click_with_pause(page, "button[data-autom='guest-checkout-btn']", 1000);
    await smartType(page, "input[id='checkout.fulfillment.deliveryTab.delivery.deliveryLocation.address.postalCode']", "07083", 500);
    await page.keyboard.press('Enter');
    await smart_click_with_pause(page, "button[data-autom='fulfillment-continue-button']", 5000);
}

async function shipping(page) {
    await smartType(page, "input[data-autom='form-field-firstName']", shippingDetails.firstName, 500);
    await smartType(page, "input[data-autom='form-field-lastName']", shippingDetails.Lastname, 500);
    await smartType(page, "input[data-autom='form-field-street']", shippingDetails.StreetAddress, 500);

    if (shippingDetails.Apt) {
        await smartType(page, "input[data-autom='form-field-street2']", shippingDetails.Apt, 500);
    }

    await smartType(page, "input[data-autom='form-field-postalCode']", shippingDetails.zip, 500);
    await smartType(page, "input[data-autom='form-field-emailAddress']", shippingDetails.email, 500);
    await smartType(page, "input[data-autom='form-field-fullDaytimePhone']", shippingDetails.phone, 500);

    // Click the continue button with error handling
    try {
        await page.waitForSelector("#rs-checkout-continue-button-bottom", { timeout: 30000 });
        await page.click("#rs-checkout-continue-button-bottom");
    } catch (error) {
        console.log('Error clicking shipping continue button:', error.message);
        await page.screenshot({ path: 'shipping_error.png' });
    }
}

async function payment(page) {
    let cards = new Map();
    cards.set(0, { type: 'Visa', number: '4539599499307422', expData: '07/25', cvv: '250' });
    let card1 = cards.get(0);

    try {
        console.log('Filling payment');
        await page.waitForTimeout(3000);
        await page.waitForSelector("span[class='form-label-small']", { timeout: 30000 });
        await page.click("span[class='form-label-small']");

        await page.waitForSelector("input[id='checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.cardNumber']", { timeout: 30000 });
        await page.type("input[id='checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.cardNumber']", card1.number);
        await page.waitForTimeout(500);
        await page.type("input[id='checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.expiration']", card1.expData);
        await page.waitForTimeout(500);
        await page.type("input[id='checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.securityCode']", card1.cvv);
        await page.waitForTimeout(750);
    } catch (ex) {
        console.log("Primary payment click failed:", ex.message);
        await page.screenshot({ path: 'payment_error_primary.png' });
        await page.evaluate(() => document.getElementsByClassName("form-label-small")[0].click());
    }

    try {
        await page.waitForSelector('#rs-checkout-continue-button-bottom', { timeout: 30000 });
        await page.click('#rs-checkout-continue-button-bottom');
        console.log('Waiting to place order...');
        await page.waitForTimeout(10000);
        console.log('Placing Order...');
        await page.click("button[id='rs-checkout-continue-button-bottom']");
    } catch (ex) {
        console.log('Error placing order:', ex.message);
        await page.screenshot({ path: 'payment_error_place_order.png' });
        try {
            console.log('Trying form button...');
            await page.evaluate(() => document.getElementsByClassName('form-button')[0].click());
        } catch (ex1) {
            try {
                console.log('Trying XPath...');
                let el = await page.$x('//*[@id="rs-checkout-continue-button-bottom"]');
                await el[0].click();
            } catch (ex2) {
                console.log("None of the click attempts worked!");
            }
        }
    }
}

// Helper functions
async function smart_click_with_pause(page, selector, pause) {
    try {
        await page.waitForSelector(selector, { timeout: 30000 }); // Increased timeout
        await page.evaluate((s) => document.querySelector(s).click(), selector);
        await new Promise(r => setTimeout(r, pause));
    } catch (error) {
        throw new Error(`Failed to click selector '${selector}': ${error.message}`);
    }
}

async function smartType(page, selector, value, pause) {
    await page.waitForSelector(selector, { timeout: 30000 });
    await page.type(selector, value);
    await new Promise(r => setTimeout(r, pause));
}

// Shipping and payment details
const shippingDetails = { 
    firstName: "Bhavya  ", 
    Lastname: "Dabas",
    StreetAddress: "Rohini Delhi",
    Apt: null,
    zip: "07083",
    city: "New Delhi",
    country: "India",
    email: "testemail@gmail.com",
    phone: "(444)444-4444", 
};