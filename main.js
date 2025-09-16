const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");
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
  const htmlFiles = getHtmlFiles(dir); // 呼び出し毎にディレクトリを指定
  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, "utf-8");
    console.log(`Processing file: ${file}, replacing ${target} with ${replacement},(content.includes(target): ${content.includes(target)})`);
    //targerをreplacementに置換
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      fs.writeFileSync(file, content, "utf-8");
    }
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
