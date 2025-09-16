const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const puppeteer = require("puppeteer");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

// HTMLファイル取得
const getHtmlFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getHtmlFiles(fullPath));
    } else if (entry.isFile() && (entry.name.toLowerCase().endsWith(".html") || entry.name.toLowerCase().endsWith(".htm"))) {
      files.push(fullPath);
    }
  }
  return files;
};
//置換ハンドラ
ipcMain.handle("replace-tag", async (_, { target, replacement, dir }) => {
  if (!dir) return false;

  const htmlFiles = getHtmlFiles(dir);

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, "utf-8");
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // targetタグをすべて取得
    const elements = document.querySelectorAll(target);

    elements.forEach((el) => {
      // 新しいタグを作る
      const newEl = document.createElement(replacement);

      // 属性をコピー
      Array.from(el.attributes).forEach((attr) => {
        newEl.setAttribute(attr.name, attr.value);
      });

      // 中身をコピー
      newEl.innerHTML = el.innerHTML;

      // 元の要素を置換
      el.replaceWith(newEl);
    });

    // DOM 全体を文字列化してファイルに書き戻す
    fs.writeFileSync(file, dom.serialize(), "utf-8");
  }

  return true;
});

// ✅ フォルダ選択専用ハンドラ
ipcMain.handle("select-dir", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return canceled ? null : filePaths[0];
});

// 解析専用ハンドラ
ipcMain.handle("analyze-project", async (_event, dirPath) => {
  const targetDir = dirPath;
  const htmlFiles = getHtmlFiles(targetDir);
  const allHtmlFilesSet = new Set(htmlFiles); // 全HTMLファイル一覧

  const tagAttrStats = {}; // タグ＋属性の集計

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf-8");
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // すべての要素を取得
    const elements = document.querySelectorAll("*");

    elements.forEach((el) => {
      // 属性文字列を作る
      const attrStr = Array.from(el.attributes)
        .map((attr) => ` ${attr.name}="${attr.value}"`)
        .join("");

      const key = `<${el.tagName.toLowerCase()}${attrStr}>`; // 小文字化して統一

      if (!tagAttrStats[key]) {
        tagAttrStats[key] = {
          count: 0,
          usedFiles: new Set(),
          unusedFiles: new Set(),
        };
      }

      tagAttrStats[key].count++;
      tagAttrStats[key].usedFiles.add(file);
    });
  }

  // 未使用ファイルの計算
  Object.keys(tagAttrStats).forEach((key) => {
    const used = tagAttrStats[key].usedFiles;
    const unused = [...allHtmlFilesSet].filter((f) => !used.has(f)); //htmlすべてから、usedにないものだけを通すフィルタ
    tagAttrStats[key].unusedFiles = new Set(unused);
  });

  return {
    dir: targetDir,
    tagAttrStats: Object.entries(tagAttrStats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        count: data.count,
        usedFiles: [...data.usedFiles],
        unusedFiles: [...data.unusedFiles],
      })),
  };
});

app.whenReady().then(createWindow);
