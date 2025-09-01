let tagData = [];
let classData = [];

// 共通描画関数
const renderTable = (data, tableId, filter = "") => {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  data
    .filter((row) => row.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b.count - a.count)
    .forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.count}</td><td>${row.name}</td><td>${row.files.join(", ")}</td>`;
      tbody.appendChild(tr);
    });
};

document.addEventListener("DOMContentLoaded", () => {
  const tagSearchInput = document.getElementById("tagSearch");
  const classSearchInput = document.getElementById("classSearch");

  // タグ検索
  tagSearchInput.addEventListener("input", (e) => {
    renderTable(tagData, "tagTable", e.target.value);
  });

  // クラス検索
  classSearchInput.addEventListener("input", (e) => {
    renderTable(classData, "classTable", e.target.value);
  });
});
