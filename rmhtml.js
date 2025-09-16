const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { JSDOM } = require("jsdom");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("処理するHTMLファイルのパスを入力してください: ", (filePath) => {
  filePath = filePath.trim();

  if (!fs.existsSync(filePath)) {
    console.log("ファイルが存在しません");
    rl.close();
    return;
  }

  const html = fs.readFileSync(filePath, "utf-8");
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // 1. <body>内の不要タグ(script, style, iframe, noscript, a)を除去してテキスト取得
  const bodyClone = document.body.cloneNode(true);
  bodyClone.querySelectorAll("script, style, iframe, noscript, a").forEach((el) => el.remove());
  const bodyText = bodyClone.textContent.replace(/\s+/g, " ").trim();

  // 2. <Main>タグの中身だけを取り出す
  const mainTexts = Array.from(document.querySelectorAll("Main")).map((el) => el.textContent.trim());

  const result = (bodyText + " " + mainTexts.join(" ")).replace(/\s+/g, "");

  console.log("=== 1.の結果 ===");
  console.log(bodyText);
  console.log("\n=== 2.の結果 ===");
  console.log(result);

  rl.close();
});
