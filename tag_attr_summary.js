// tag_attr_summary.js
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const targetDir = "./sample-project"; // 対象ディレクトリ

// 再帰的にHTMLファイル取得
const getHtmlFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getHtmlFiles(fullPath));
    } else if (entry.isFile() && (entry.name.toLowerCase().endsWith(".html") || entry.name.toLowerCase().endsWith(".htm"))) {
      //末尾htmlかhtm
      files.push(fullPath);
    }
  }
  return files;
};

// 再帰的にCSSファイル取得
const getCssFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".css")) {
      files.push(fullPath);
    }
  }
  return files;
};

const htmlFiles = getHtmlFiles(targetDir);
const cssFiles = getCssFiles(targetDir);

const tagAttrStats = {}; // {"key": {count, files:Set}}

/* 
{
  "<meta charset=\"UTF-8\">": {
    count: 5,
    files:Set(["index.html", "about.html"])
  },
  "<div class=\"main\">": {
    count: 12,
    files: Set(["index.html"])
  }
}
*/

const classStats = {}; // {className: {count, files:Set}}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf-8");
  const $ = cheerio.load(html, { decodeEntities: false });

  // タグ＋属性集計
  // すべての要素についてループ
  $("*").each((_, el) => {
    // el.attribs は {属性名: 値} のオブジェクト。
    // 例：<meta charset="UTF-8"> → { charset: "UTF-8" }
    // 属性を " attr名="値" 形式で結合していきます。
    // attrStr にスペースを先頭につけることでタグ名の後ろに自然につなげる。
    let attrStr = "";
    for (const [attr, val] of Object.entries(el.attribs)) {
      attrStr += ` ${attr}="${val}"`;
    }
    // 例：<meta charset="UTF-8">
    const key = `<${el.tagName}${attrStr}>`;
    //Set 集合
    if (!tagAttrStats[key]) tagAttrStats[key] = { count: 0, files: new Set() };
    tagAttrStats[key].count++;
    tagAttrStats[key].files.add(file);
  });

  // クラス集計
  $("[class]").each((_, el) => {
    const classes = $(el).attr("class").split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      if (!classStats[cls]) classStats[cls] = { count: 0, files: new Set() };
      classStats[cls].count++;
      classStats[cls].files.add(file);
    }
  });
}

cssFiles.forEach((file) => {
  const css = fs.readFileSync(file, "utf-8");
  const $ = cheerio.load(css, { decodeEntities: false });
});

// 出力関数
const outputStats = (stats, title) => {
  console.log(`\n=== ${title} ===`);
  Object.entries(stats)
    .sort((a, b) => b[1].count - a[1].count) //sortの中に関数を設定。正なら引数1を引数2の後ろに並べ替え。負なら引数1を引数2の前に並べ替え。0なら何もしない。
    .forEach(([name, data]) => {
      console.log(`${data.count}\t${name}\t${Array.from(data.files).join(", ")}`);
    });
};

outputStats(tagAttrStats, "タグ＋属性 一覧");
// outputStats(classStats, "CSS クラス 一覧");
