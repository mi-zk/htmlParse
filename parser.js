const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// ------------------------
// class を抽出する
// ------------------------
async function extractAttributes(dir) {
  const result = {};
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) continue; //ディレクトリ名のときはスキップ

    const content = fs.readFileSync(fullPath, "utf-8");

    //class処理
    if (file.endsWith(".html")) {
      const $ = cheerio.load(content); // HTMLをパース
      $("[class]").each((_, el) => {
        // class属性を持つ要素を全て取得
        const classes = ($(el).attr("class") || "").split(/\s+/).filter(Boolean); // class名を分割
        classes.forEach((c) => {
          if (!result[c]) result[c] = { html: [], css: [], js: [] };
          result[c].html.push(file);
        });
      });
    } else if (file.endsWith(".css")) {
      const regex = /\.([a-zA-Z0-9\-_]+)/g; // CSSのクラス名を抽出する正規表現 ex: .class, .h1 など
      let m;
      while ((m = regex.exec(content)) !== null) {
        const c = m[1]; // マッチしたクラス名
        if (!result[c]) result[c] = { html: [], css: [], js: [] };
        result[c].css.push(file);
      }
    } else if (file.endsWith(".js")) {
      const classRegex = /(?:classList\.add|classList\.remove|classList\.toggle|querySelector(?:All)?)\(['"`]([a-zA-Z0-9\-_]+)['"`]\)/g; // JSのクラス名を抽出する正規表現
      let m;
      while ((m = classRegex.exec(content)) !== null) {
        const c = m[1];
        if (!result[c]) result[c] = { html: [], css: [], js: [] };
        result[c].js.push(file);
      }
    }

    // id属性の処理
    if (file.endsWith(".html")) {
      const $ = cheerio.load(content); // HTMLをパース
      console.log($);
      // --- id属性の収集 ---
      $("[id]").each((_, el) => {
        const id = $(el).attr("id");
        if (id) {
          if (!result.ids[id]) result.ids[id] = { html: [], css: [], js: [] };
          result.ids[id].html.push(file);
        }
      });
    } else if (file.endsWith(".css")) {
      const idRegex = /#([a-zA-Z0-9\-_]+)/g;
      let m;
      while ((m = idRegex.exec(content)) !== null) {
        const id = m[1];
        if (!result.ids[id]) result.ids[id] = { html: [], css: [], js: [] };
        result.ids[id].css.push(file);
      }
    } else if (file.endsWith(".js")) {
      // id用
      const idRegex = /getElementById\(['"`]([a-zA-Z0-9\-_]+)['"`]\)/g;
      while ((m = idRegex.exec(content)) !== null) {
        const id = m[1];
        if (!result.ids[id]) result.ids[id] = { html: [], css: [], js: [] };
        result.ids[id].js.push(file);
      }
    }

    // URLの処理
    // if (file.endsWith(".html")) {
    //   const $ = cheerio.load(content); // HTMLをパース
    //   console.log($);
    //   $("[class]").each((_, el) => {
    //     // class属性を持つ要素を全て取得
    //     const classes = ($(el).attr("class") || "").split(/\s+/).filter(Boolean); // class名を分割
    //     classes.forEach((c) => {
    //       if (!result[c]) result[c] = { html: [], css: [], js: [] };
    //       result[c].html.push(file);
    //     });
    //   });
    // } else if (file.endsWith(".css")) {
    //   const regex = /\.([a-zA-Z0-9\-_]+)/g; // CSSのクラス名を抽出する正規表現 ex: .class, .h1 など
    //   let m;
    //   while ((m = regex.exec(content)) !== null) {
    //     const c = m[1]; // マッチしたクラス名
    //     if (!result[c]) result[c] = { html: [], css: [], js: [] };
    //     result[c].css.push(file);
    //   }
    // } else if (file.endsWith(".js")) {
    //   const regex = /(?:classList\.add|classList\.remove|classList\.toggle|querySelector(?:All)?)\(['"`]([a-zA-Z0-9\-_]+)['"`]\)/g; // JSのクラス名を抽出する正規表現
    //   let m;
    //   while ((m = regex.exec(content)) !== null) {
    //     const c = m[1];
    //     if (!result[c]) result[c] = { html: [], css: [], js: [] };
    //     result[c].js.push(file);
    //   }
    // }
  }

  return result;
}

// ------------------------
// class を置換する
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
      const $ = cheerio.load(content);
      $("[class]").each((_, el) => {
        const classes = ($(el).attr("class") || "").split(/\s+/).map((c) => (c === oldName ? newName : c));
        $(el).attr("class", classes.join(" "));
      });
      content = $.html();
    } else if (file.endsWith(".css")) {
      const regex = new RegExp(`\\.${oldName}\\b`, "g");
      content = content.replace(regex, `.${newName}`);
    } else if (file.endsWith(".js")) {
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

// ------------------------
// id を置換する
// ------------------------
async function renameId(oldId, newId, dir = "./sample-project") {
  const files = fs.readdirSync(dir);
  const changedFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 再帰対応
      changedFiles.push(...(await renameId(oldId, newId, fullPath)));
      continue;
    }

    let content = fs.readFileSync(fullPath, "utf-8");
    let original = content;

    if (file.endsWith(".html")) {
      const $ = cheerio.load(content, { decodeEntities: false });
      $("[id]").each((_, el) => {
        if ($(el).attr("id") === oldId) {
          $(el).attr("id", newId);
        }
      });
      content = $.html();
    } else if (file.endsWith(".css")) {
      // CSS の #id を置換
      const regex = new RegExp(`#${oldId}(?=[^a-zA-Z0-9_-]|$)`, "g");
      content = content.replace(regex, `#${newId}`);
    } else if (file.endsWith(".js")) {
      // JavaScript 内での "id名" や 'id名' を置換
      const regex = new RegExp(`(['"\`])${oldId}\\1`, "g");
      content = content.replace(regex, `$1${newId}$1`);
    }

    if (content !== original) {
      fs.writeFileSync(fullPath, content, "utf-8");
      changedFiles.push(fullPath);
    }
  }

  return changedFiles;
}

module.exports = { extractAttributes, renameClass, renameId };
