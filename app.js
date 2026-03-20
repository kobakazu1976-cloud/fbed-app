// ===== 保存キー =====
const TASK_KEY = "fbed_tasks";
const CHECK_KEY = "fbed_checks";

// ===== ADHD変換（ここが肝） =====
function transformTask(task) {
  // 超シンプルに分解（後で賢くもできる）
  const rules = [
    { keyword: "勉強", steps: ["机に座る", "教科書を開く", "1ページだけやる"] },
    { keyword: "仕事", steps: ["PCを開く", "メールを1通確認", "5分だけやる"] },
    { keyword: "掃除", steps: ["1ヶ所だけ片付ける", "ゴミを1つ捨てる"] },
    { keyword: "運動", steps: ["立ち上がる", "ストレッチ10秒"] }
  ];

  for (let rule of rules) {
    if (task.includes(rule.keyword)) {
      return rule.steps;
    }
  }

  // デフォルト（全部分解）
  return [
    "やる場所に行く",
    task,
    "終わったらチェック"
  ];
}

// ===== 保存 =====
function saveAll() {
  const tasks = [];
  const checks = [];

  document.querySelectorAll("#taskList li").forEach((li) => {
    tasks.push(li.querySelector("span").textContent);
    checks.push(li.querySelector("input").checked);
  });

  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
}

// ===== 読み込み =====
function loadAll() {
  const tasks = JSON.parse(localStorage.getItem(TASK_KEY) || "[]");
  const checks = JSON.parse(localStorage.getItem(CHECK_KEY) || "[]");

  tasks.forEach((task, index) => {
    addTaskToList(task, checks[index]);
  });
}

// ===== UI生成 =====
function addTaskToList(task, checked = false) {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.onchange = saveAll;

  const span = document.createElement("span");
  span.textContent = task;

  const delBtn = document.createElement("button");
  delBtn.textContent = "削除";
  delBtn.style.marginLeft = "10px";
  delBtn.onclick = function () {
    li.remove();
    saveAll();
  };

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  document.getElementById("taskList").appendChild(li);
}

// ===== 追加ボタン =====
function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (text === "") return;

  // ADHD変換
  const steps = transformTask(text);

  steps.forEach(step => addTaskToList(step));

  saveAll();
  input.value = "";
}

// ===== 初期化 =====
window.onload = function () {
  loadAll();
};
