const fs = require("fs");
const path = require("path");

// 対象ディレクトリ
const targetDir = "./sample-project/basic"; // CSSディレクトリに変更

// 再帰的にCSSファイルを取得
function getCssFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getCssFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      files.push(fullPath);
    }
  }
  return files;
}

// CSSからクラス名を抽出して出現回数・ファイルリストを取得
function countClasses(files) {
  const classInfo = {};
  const classRegex = /\.([a-zA-Z0-9_-]+)[\s,{]/g;

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    let match;
    const classesInFile = new Set();

    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      // 出現回数
      classInfo[className] = classInfo[className] || { count: 0, files: new Set() };
      classInfo[className].count += 1;
      classesInFile.add(className);
    }

    // ファイル情報を追加
    classesInFile.forEach((cn) => classInfo[cn].files.add(file));
  });

  // Setを配列に変換
  for (const key in classInfo) {
    classInfo[key].files = Array.from(classInfo[key].files);
  }

  return classInfo;
}

const cssFiles = getCssFiles(targetDir);
const result = countClasses(cssFiles);

console.log("クラス情報:");
console.log(JSON.stringify(result, null, 2));
