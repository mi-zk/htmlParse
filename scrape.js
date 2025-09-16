const puppeteer = require("puppeteer");
const { JSDOM } = require("jsdom");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage();

  // 任意のページを開く
  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });

  // ページ全体のHTMLを取得
  const html = await page.content();

  // JSDOMでDOM化
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // querySelector で要素を取得
  const title = document.querySelector("h1")?.textContent || "";
  console.log("タイトル:", title);

  await browser.close();
})();
