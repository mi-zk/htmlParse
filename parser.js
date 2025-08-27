// parser.js
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

function extractAttributes(dirPath) {
  const classes = {};
  const ids = {};

  function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, "utf-8");

    if (ext === ".html") {
      const $ = cheerio.load(content);

      // class属性
      $("[class]").each((_, el) => {
        const classNames = $(el).attr("class").split(/\s+/).filter(Boolean);
        classNames.forEach((cls) => {
          if (!classes[cls]) classes[cls] = { html: [], css: [], js: [] };
          classes[cls].html.push(filePath);
        });
      });

      // id属性
      $("[id]").each((_, el) => {
        const idName = $(el).attr("id");
        if (idName) {
          if (!ids[idName]) ids[idName] = { html: [], css: [], js: [] };
          ids[idName].html.push(filePath);
        }
      });
    }

    if (ext === ".css") {
      const classMatches = content.match(/\.[A-Za-z0-9_-]+/g) || [];
      classMatches.forEach((cls) => {
        const name = cls.slice(1);
        if (!classes[name]) classes[name] = { html: [], css: [], js: [] };
        classes[name].css.push(filePath);
      });

      const idMatches = content.match(/#[A-Za-z0-9_-]+/g) || [];
      idMatches.forEach((id) => {
        const name = id.slice(1);
        if (!ids[name]) ids[name] = { html: [], css: [], js: [] };
        ids[name].css.push(filePath);
      });
    }

    if (ext === ".js") {
      const classMatches = content.match(/['"`]\.([A-Za-z0-9_-]+)['"`]/g) || [];
      classMatches.forEach((match) => {
        const name = match.replace(/['"`\.]/g, "");
        if (!classes[name]) classes[name] = { html: [], css: [], js: [] };
        classes[name].js.push(filePath);
      });

      const idMatches = content.match(/['"`]#([A-Za-z0-9_-]+)['"`]/g) || [];
      idMatches.forEach((match) => {
        const name = match.replace(/['"`#]/g, "");
        if (!ids[name]) ids[name] = { html: [], css: [], js: [] };
        ids[name].js.push(filePath);
      });
    }
  }

  function walkDir(currentPath) {
    fs.readdirSync(currentPath).forEach((file) => {
      const fullPath = path.join(currentPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath);
      } else {
        processFile(fullPath);
      }
    });
  }

  walkDir(dirPath);

  return { classes, ids };
}

function renameClass(dirPath, oldName, newName) {
  walkAndReplace(dirPath, (content, ext) => {
    if (ext === ".html") {
      const $ = cheerio.load(content);
      $("[class]").each((_, el) => {
        let classList = $(el).attr("class").split(/\s+/);
        classList = classList.map((cls) => (cls === oldName ? newName : cls));
        $(el).attr("class", classList.join(" "));
      });
      return $.html();
    }

    if (ext === ".css") {
      return content.replace(new RegExp(`\\.${oldName}(?=[^A-Za-z0-9_-])`, "g"), `.${newName}`);
    }

    if (ext === ".js") {
      return content.replace(new RegExp(`(['"\`])\\.${oldName}(['"\`])`, "g"), `$1.${newName}$2`);
    }

    return content;
  });
}

function renameId(dirPath, oldId, newId) {
  walkAndReplace(dirPath, (content, ext) => {
    if (ext === ".html") {
      const $ = cheerio.load(content);
      $("[id]").each((_, el) => {
        if ($(el).attr("id") === oldId) {
          $(el).attr("id", newId);
        }
      });
      return $.html();
    }

    if (ext === ".css") {
      return content.replace(new RegExp(`#${oldId}(?=[^A-Za-z0-9_-])`, "g"), `#${newId}`);
    }

    if (ext === ".js") {
      return content.replace(new RegExp(`(['"\`])#${oldId}(['"\`])`, "g"), `$1#${newId}$2`);
    }

    return content;
  });
}

function walkAndReplace(dirPath, replacer) {
  function walkDir(currentPath) {
    fs.readdirSync(currentPath).forEach((file) => {
      const fullPath = path.join(currentPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath);
      } else {
        const ext = path.extname(fullPath).toLowerCase();
        const content = fs.readFileSync(fullPath, "utf-8");
        const newContent = replacer(content, ext);
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent, "utf-8");
        }
      }
    });
  }
  walkDir(dirPath);
}

module.exports = {
  extractAttributes,
  renameClass,
  renameId,
};
