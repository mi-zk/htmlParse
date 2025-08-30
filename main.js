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
    } else if (entry.isFile() && (entry.name.toLowerCase().endsWith(".html") || entry.name.toLowerCase().endsWith(".htm"))) {
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

  const tagAttrStats = {};
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

  return {
    tagAttrStats: Object.entries(tagAttrStats)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      count: data.count,
      files: Array.from(data.files),
    })),
    classStats: Object.entries(classStats).map(([name, data]) => ({
      name,
      count: data.count,
      files: Array.from(data.files),
    })),
  };
});

app.whenReady().then(createWindow);
