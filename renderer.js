function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let tagData = [];
//置換用
let currentDir = "";

const loadingEl = document.getElementById("loading");

const renderTable = (data, tableId, filter = "") => {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";

  data
    .filter((row) => row.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach((row) => {
      const usedList = row.usedFiles.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
      const unusedList = row.unusedFiles.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.count}</td>
        <td>${escapeHtml(row.name)}</td>
        <td><details><summary>使用(${row.usedFiles.length})</summary><ul>${usedList}</ul></details></td>
        <td><details><summary>未使用(${row.unusedFiles.length})</summary><ul>${unusedList}</ul></details></td>`;
      tbody.appendChild(tr);
    });
};

// === ディレクトリ選択 ===

document.getElementById("selectDir").addEventListener("click", async () => {
  // ① フォルダ選択
  const dirPath = await window.api.selectDir();
  if (!dirPath) return;
  currentDir = dirPath;

  // ② 解析
  // 解析開始：スピナー表示
  loadingEl.style.display = "flex";

  // UI を描画させてから解析開始
  setTimeout(async () => {
    try {
      const result = await window.api.analyzeProject(dirPath);
      if (result) {
        tagData = result.tagAttrStats;
        renderTable(tagData, "tagTable");
      }
    } finally {
      loadingEl.style.display = "none";
    }
  }, 0);
});

window.addEventListener("loading-start", () => {
  loadingEl.style.display = "flex";
});
window.addEventListener("loading-end", () => {
  loadingEl.style.display = "none";
});
document.getElementById("tagSearch").addEventListener("input", (e) => {
  renderTable(tagData, "tagTable", e.target.value);
});

// === 置換処理 ===
document.getElementById("replaceBtn").addEventListener("click", async () => {
  const from = document.getElementById("tagSearch").value;
  const to = document.getElementById("replaceTo").value;
  if (!from) {
    await window.api.showDialog("置換元を入力してください");
    return;
  }
  //main.jsのipcMain.handle("replace-tag", ...)に処理を依頼
  await window.api.replaceTag(from, to, currentDir);
  await window.api.showDialog("置換完了");
  // 再解析して表示更新
  const result = await window.api.analyzeProject(currentDir);
  if (!result) return;
  tagData = result.tagAttrStats;
  renderTable(tagData, "tagTable");
});

//起動時
document.addEventListener("DOMContentLoaded", async () => {
  window.dispatchEvent(new Event("loading-end"));
});
