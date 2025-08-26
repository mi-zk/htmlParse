const classListEl = document.getElementById("classList");
const oldNameEl = document.getElementById("oldName");
const newNameEl = document.getElementById("newName");
const renameBtn = document.getElementById("renameBtn");
const logEl = document.getElementById("log");

let classes = {};

// 最初にクラス抽出
window.api.extractAttributes("./sample-project").then((result) => {
  classes = result;
  updateClassList();
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

renameBtn.onclick = () => {
  const oldName = oldNameEl.value.trim();
  const newName = newNameEl.value.trim();
  if (!oldName || !newName) return;
  window.api.renameClass(oldName, newName).then((res) => {
    logEl.textContent = res;
  });
};
