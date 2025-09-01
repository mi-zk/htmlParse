let tagData = []; // 初期値は空
let classData = [];

const renderTable = (data, tableId, filter = "") => {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  data
    .filter((row) => row.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b.count - a.count)
    .forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.count}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.usedFiles.join(", ")}</td>
        <td>${row.unusedFiles.join(", ")}</td>`;
      tbody.appendChild(tr);
    });
};

document.addEventListener("DOMContentLoaded", async () => {
  const result = await window.api.analyzeProject();
  if (!result) return;

  // 初期値として保持
  tagData = result.tagAttrStats;
  classData = result.classStats; // ←クラスもあるなら同様に

  // 初期描画
  renderTable(tagData, "tagTable");
  renderTable(classData, "classTable");

  // 検索イベント
  document.getElementById("tagSearch").addEventListener("input", (e) => {
    renderTable(tagData, "tagTable", e.target.value);
  });
  document.getElementById("classSearch").addEventListener("input", (e) => {
    renderTable(classData, "classTable", e.target.value);
  });
});
