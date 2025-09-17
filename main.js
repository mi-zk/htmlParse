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
  if (!target) return false; // 置換元が空なら何もしない

  const htmlFiles = getHtmlFiles(dir);

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, "utf-8");
    const dom = new JSDOM(html);
    const document = dom.window.document;

    document.querySelectorAll("*").forEach((el) => {
      // <tag attr="val" attr2="val2"> の形に正規化
      const attrStr = Array.from(el.attributes)
        .map((a) => ` ${a.name}="${a.value}"`)
        .join("");
      const key = `<${el.tagName.toLowerCase()}${attrStr}>`;

      if (key === target) {
        if (!replacement) {
          // 置換後が空ならタグごと削除
          el.remove();
        } else {
          // 置換処理：タグ名ごと入れ替える例
          const newTag = replacement.replace(/^<|>$/g, ""); // 例: <div> -> div
          const newEl = document.createElement(newTag);
          // 子要素・テキストを保持
          while (el.firstChild) newEl.appendChild(el.firstChild);
          el.replaceWith(newEl);
        }
      }
    });

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

  const MAX_FILES = 100;
  if (htmlFiles.length > MAX_FILES) {
    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
      type: "info", // info | warning | error など
      buttons: ["OK"],
      defaultId: 0,
      title: "完了",
      message: `HTMLファイルが多すぎます（${htmlFiles.length}個）。最大は${MAX_FILES}個です。`, // 表示したいメッセージ
    });
    return { error: `HTMLファイルが多すぎます（${htmlFiles.length}個）。最大は${MAX_FILES}個です。` };
  }

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

ipcMain.handle("show-dialog", async (_, message) => {
  await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
    type: "info", // info | warning | error など
    buttons: ["OK"],
    defaultId: 0,
    title: "完了",
    message, // 表示したいメッセージ
  });
});

app.whenReady().then(createWindow);
