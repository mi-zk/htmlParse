const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");

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
    } else if (
      entry.isFile() &&
      (entry.name.toLowerCase().endsWith(".html") ||
        entry.name.toLowerCase().endsWith(".htm"))
    ) {
      files.push(fullPath);
    }
  }
  return files;
};

// CSSファイル取得
const getCssFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getCssFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".css")) {
      files.push(fullPath);
    }
  }
  return files;
};

// IPCで処理
ipcMain.handle("analyze-project", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (canceled) return null;

  const targetDir = filePaths[0];
  const htmlFiles = getHtmlFiles(targetDir);
  const cssFiles = getCssFiles(targetDir);
  const allHtmlFilesSet = new Set(htmlFiles); // 全HTMLファイル一覧
  const allCssFilesSet = new Set(cssFiles); // 全CSSファイル一覧

  const tagAttrStats = {}; // タグ＋属性の集計
  const classStats = {};

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf-8");
    const $ = cheerio.load(html, { decodeEntities: false });

    // タグ＋属性集計
    $("*").each((_, el) => {
      let attrStr = "";
      for (const [attr, val] of Object.entries(el.attribs)) {
        attrStr += ` ${attr}="${val}"`;
      }
      const key = `<${el.tagName}${attrStr}>`;
      if (!tagAttrStats[key])
        tagAttrStats[key] = {
          count: 0,
          usedFiles: new Set(),
          unusedFiles: new Set(),
        };
      tagAttrStats[key].count++;
      tagAttrStats[key].usedFiles.add(file);
    });
  }

  for (const cssFile of cssFiles) {
    const cssContent = fs.readFileSync(cssFile, "utf-8");
    // 正規表現でクラスセレクタを抽出
    const matches = cssContent.match(/\.[a-zA-Z0-9_-]+/g) || [];

    for (const match of matches) {
      const cls = match.slice(1); // 先頭の . を除去
      if (!classStats[cls])
        classStats[cls] = {
          count: 0,
          usedFiles: new Set(),
          unusedFiles: new Set(),
        };
      classStats[cls].count++;
      classStats[cls].usedFiles.add(cssFile);
    }
  }

  // 未使用ファイルの計算
  Object.keys(tagAttrStats).forEach((key) => {
    const used = tagAttrStats[key].usedFiles;
    const unused = [...allHtmlFilesSet].filter((f) => !used.has(f)); //htmlすべてから、usedにないものだけを通すフィルタ
    tagAttrStats[key].unusedFiles = new Set(unused);
  });

  // 未使用ファイルの計算
  Object.keys(classStats).forEach((key) => {
    const used = classStats[key].usedFiles;
    const unused = [...allCssFilesSet].filter((f) => !used.has(f)); //htmlすべてから、usedにないものだけを通すフィルタ
    classStats[key].unusedFiles = new Set(unused);
  });

  return {
    tagAttrStats: Object.entries(tagAttrStats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        count: data.count,
        usedFiles: [...data.usedFiles],
        unusedFiles: [...data.unusedFiles],
      })),
    classStats: Object.entries(classStats)
      .sort((a, b) => b[1].count - a[1].count) // ← 並び替え追加
      .map(([name, data]) => ({
        type: "class", // ← 区別できるように
        name,
        count: data.count,
        usedFiles: [...data.usedFiles],
        unusedFiles: [...data.unusedFiles],
      })),
  };
});

app.whenReady().then(createWindow);
