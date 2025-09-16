const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Chrome の実行ファイル
    headless: true,
  });
  const page = await browser.newPage();

  // 任意のページを開く
  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });

  // ページ全体のHTMLを取得
  const html = await page.content();

  // cheerioに読み込ませる
  const $ = cheerio.load(html);

  // cheerioでパースして要素を取得
  const title = $("h1").text();
  console.log("タイトル:", title);

  await browser.close();
})();
