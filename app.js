const TASK_KEY = "fbed_tasks_v3";
const MORNING_KEY = "fbed_morning_checks_v1";

// ===== ADHD変換（カテゴリ付き） =====
function transformTask(task) {
  const rules = [
    {
      keyword: "勉強",
      category: "勉強",
      steps: ["机に座る", "教科書を開く", "1ページだけやる"]
    },
    {
      keyword: "宿題",
      category: "勉強",
      steps: ["宿題を出す", "1問だけやる", "終わったらしまう"]
    },
    {
      keyword: "掃除",
      category: "掃除",
      steps: ["1ヶ所だけ片付ける", "ゴミを1つ捨てる"]
    },
    {
      keyword: "運動",
      category: "運動",
      steps: ["立ち上がる", "ストレッチ10秒"]
    }
  ];

  for (let rule of rules) {
    if (task.includes(rule.keyword)) {
      return {
        category: rule.category,
        steps: rule.steps
      };
    }
  }

  return {
    category: "その他",
    steps: ["やる場所に行く", task, "終わったらチェックする"]
  };
}

// ===== 保存 =====
function saveTasks() {
  const data = [];

  document.querySelectorAll(".category-block").forEach((block) => {
    const category = block.dataset.category;
    const items = [];

    block.querySelectorAll("li").forEach((li) => {
      items.push({
        text: li.querySelector(".task-text").textContent,
        done: li.querySelector(".task-checkbox").checked
      });
    });

    data.push({ category, items });
  });

  localStorage.setItem(TASK_KEY, JSON.stringify(data));
}

// ===== 読み込み =====
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem(TASK_KEY) || "[]");

  saved.forEach(group => {
    const block = createCategoryBlock(group.category);

    group.items.forEach(item => {
      addTaskToCategory(block, item.text, item.done);
    });
  });

  updateCounts();
}

// ===== カテゴリブロック作成 =====
function createCategoryBlock(category) {
  let existing = document.querySelector(`[data-category="${category}"]`);
  if (existing) return existing;

  const block = document.createElement("div");
  block.className = "category-block";
  block.dataset.category = category;

  const title = document.createElement("h3");
  title.textContent = "▼ " + category;

  const list = document.createElement("ul");

  block.appendChild(title);
  block.appendChild(list);

  document.getElementById("taskList").appendChild(block);

  return block;
}

// ===== タスク追加 =====
function addTaskToCategory(block, task, done = false) {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = done;

  const span = document.createElement("span");
  span.className = "task-text";
  span.textContent = task;

  const delBtn = document.createElement("button");
  delBtn.textContent = "削除";
  delBtn.className = "delete-btn";
  delBtn.onclick = function () {
    li.remove();
    saveTasks();
    updateCounts();
  };

  checkbox.onchange = function () {
    moveTask(li, checkbox.checked);
    saveTasks();
    updateCounts();
  };

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  if (done) {
    document.getElementById("doneList").appendChild(li);
  } else {
    block.querySelector("ul").appendChild(li);
  }
}

// ===== 移動 =====
function moveTask(li, done) {
  if (done) {
    document.getElementById("doneList").appendChild(li);
  }
}

// ===== 追加処理 =====
function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (text === "") return;

  const result = transformTask(text);

  const block = createCategoryBlock(result.category);

  result.steps.forEach(step => {
    addTaskToCategory(block, step);
  });

  input.value = "";
  saveTasks();
  updateCounts();
}

// ===== カウント =====
function updateCounts() {
  const remaining = document.querySelectorAll("#taskList li").length;
  const done = document.querySelectorAll("#doneList li").length;

  document.getElementById("remainingCount").textContent = remaining;
  document.getElementById("doneCount").textContent = done;
}

// ===== 朝チェック保存 =====
function saveMorningChecks() {
  const states = [];
  document.querySelectorAll(".morning-check").forEach((check) => {
    states.push(check.checked);
  });
  localStorage.setItem(MORNING_KEY, JSON.stringify(states));
}

function loadMorningChecks() {
  const saved = JSON.parse(localStorage.getItem(MORNING_KEY) || "[]");
  document.querySelectorAll(".morning-check").forEach((check, index) => {
    check.checked = saved[index] || false;
    check.onchange = saveMorningChecks;
  });
}

// ===== 初期化 =====
window.onload = function () {
  loadTasks();
  loadMorningChecks();
};
