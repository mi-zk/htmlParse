const fs = require("fs");
const path = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// 既存 extractClasses はそのまま
async function extractClasses(dir) {
  const result = {};
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) continue;

    const content = fs.readFileSync(fullPath, "utf-8");

    if (file.endsWith(".html")) {
      const dom = new JSDOM(content);
      const elements = dom.window.document.querySelectorAll("[class]");
      elements.forEach((el) => {
        el.className.split(" ").forEach((c) => {
          if (!result[c]) result[c] = { html: [], css: [], js: [] };
          result[c].html.push(`${file}`);
        });
      });
    } else if (file.endsWith(".css")) {
      const regex = /\.([a-zA-Z0-9\-_]+)/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        const c = m[1];
        if (!result[c]) result[c] = { html: [], css: [], js: [] };
        result[c].css.push(`${file}`);
      }
    } else if (file.endsWith(".js")) {
      const regex = /(?:classList\.add|classList\.remove|classList\.toggle|querySelector(?:All)?)\(['"`]([a-zA-Z0-9\-_]+)['"`]\)/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        const c = m[1];
        if (!result[c]) result[c] = { html: [], css: [], js: [] };
        result[c].js.push(`${file}`);
      }
    }
  }
  return result;
}

// ------------------------
// 実際にファイルを書き換える renameClass
// ------------------------
async function renameClass(oldName, newName, dir = "./sample-project") {
  const files = fs.readdirSync(dir);
  const changedFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) continue;

    let content = fs.readFileSync(fullPath, "utf-8");
    let original = content;

    if (file.endsWith(".html")) {
      // class="..." の中だけ置換
      content = content.replace(/class\s*=\s*"(.*?)"/gs, (match, cls) => {
        const newCls = cls
          .split(/\s+/)
          .map((c) => (c === oldName ? newName : c))
          .join(" ");
        return `class="${newCls}"`;
      });
    } else if (file.endsWith(".css")) {
      // .classname のみ置換
      const regex = new RegExp(`\\.${oldName}\\b`, "g");
      content = content.replace(regex, `.${newName}`);
    } else if (file.endsWith(".js")) {
      // classList / querySelector 内文字列のみ置換
      const regex = new RegExp(`(['"\`])${oldName}(['"\`])`, "g");
      content = content.replace(regex, `$1${newName}$2`);
    }

    if (content !== original) {
      fs.writeFileSync(fullPath, content, "utf-8");
      changedFiles.push(file);
    }
  }

  return `変更完了: ${changedFiles.join(", ")}`;
}

module.exports = { extractClasses, renameClass };
