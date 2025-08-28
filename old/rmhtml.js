const fs = require("fs");
const path = require("path");
const readline = require("readline");
const cheerio = require("cheerio");

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
  const $ = cheerio.load(html);

  //1. <body>内の選択したタグと中身を除去。不要なタグとその中身をfind()の中で指定
  const bodyText = $("body").clone().find("script, style, iframe, noscript, a").remove().end().text().replace(/\s+/g, " ").trim();

  //2. 選択したタグの中身だけを取り出す
  const texts = $("Main")
    .map((i, el) => $(el).text().trim())
    .get();
  // const result = texts.join(" ");
  const result = (bodyText + " " + texts).replace(/\s+/g, "");
  // console.log("=== 1.の結果 ===");
  // console.log(bodyText);
  console.log("\n=== 2.の結果 ===");
  console.log(result);

  rl.close();
});
