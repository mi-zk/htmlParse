const classListEl = document.getElementById("classList");
const idListEl = document.getElementById("idList");
const oldNameEl = document.getElementById("oldName");
const newNameEl = document.getElementById("newName");
const renameBtn = document.getElementById("renameBtn");
const oldIdNameEl = document.getElementById("oldIdName");
const newIdNameEl = document.getElementById("newIdName");
const renameIdBtn = document.getElementById("renameIdBtn");
const logEl = document.getElementById("log");

let classes = {};
let ids = {};

// 最初にクラス・ID抽出
window.api.extractAttributes("./sample-project").then((result) => {
  classes = result.classes || {};
  ids = result.ids || {};
  updateClassList();
  updateIdList();
});

function updateClassList() {
  classListEl.innerHTML = "";
  for (const className in classes) {
    const li = document.createElement("li");
    li.textContent = `${className} → HTML:${classes[className].html.length} CSS:${classes[className].css.length} JS:${classes[className].js.length}`;
    li.onclick = () => {
      oldNameEl.value = className;
    };
    classListEl.appendChild(li);
  }
}

function updateIdList() {
  idListEl.innerHTML = "";
  for (const idName in ids) {
    const li = document.createElement("li");
    li.textContent = `${idName} → HTML:${ids[idName].html.length} CSS:${ids[idName].css.length} JS:${ids[idName].js.length}`;
    li.onclick = () => {
      oldIdNameEl.value = idName;
    };
    idListEl.appendChild(li);
  }
}

renameBtn.onclick = () => {
  const oldName = oldNameEl.value.trim();
  const newName = newNameEl.value.trim();
  if (!oldName || !newName) {
    logEl.textContent = "クラス名を正しく入力してください。";
    return;
  }
  window.api.renameClass(oldName, newName).then((res) => {
    logEl.textContent = `クラス変更結果: ${res}`;
  });
};

renameIdBtn.onclick = () => {
  const oldId = oldIdNameEl.value.trim();
  const newId = newIdNameEl.value.trim();
  if (!oldId || !newId) {
    logEl.textContent = "ID名を正しく入力してください。";
    return;
  }
  window.api.renameId(oldId, newId).then((res) => {
    logEl.textContent = `ID変更結果: ${res}`;
  });
};
