const MORNING_KEY_PREFIX = "fbed_morning_";
const TASK_KEY_PREFIX = "fbed_tasks_";

// 今日の日付キーを作る
function getTodayKey() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMorningKey() {
  return MORNING_KEY_PREFIX + getTodayKey();
}

function getTaskKey() {
  return TASK_KEY_PREFIX + getTodayKey();
}

// ADHD向け変換ルール
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
      keyword: "学校",
      category: "学校の準備",
      steps: ["必要なものを出す", "1つだけ準備する", "終わったら確認する"]
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
    },
    {
      keyword: "病院",
      category: "病院",
      steps: ["持ち物を確認する", "出発時間を確認する", "行く準備をする"]
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

// カテゴリブロック作成
function createCategoryBlock(category) {
  let existing = document.querySelector(`[data-category="${category}"]`);
  if (existing) return existing;

  const block = document.createElement("div");
  block.className = "category-block";
  block.dataset.category = category;

  const title = document.createElement("div");
  title.className = "category-title";
  title.textContent = "▼ " + category;

  const list = document.createElement("ul");
  list.className = "category-items";

  block.appendChild(title);
  block.appendChild(list);

  document.getElementById("taskList").appendChild(block);

  return block;
}

// タスク行作成
function createTaskItem(task, category, done = false) {
  const li = document.createElement("li");
  li.dataset.category = category;
  li.dataset.done = done ? "true" : "false";

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
    cleanEmptyCategories();
    saveTasks();
    updateCounts();
    updateNowTask();
  };

  checkbox.onchange = function () {
    moveTask(li, checkbox.checked);
    cleanEmptyCategories();
    saveTasks();
    updateCounts();
    updateNowTask();
  };

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  return li;
}

// タスク追加
function addTaskToCategory(category, task, done = false) {
  const li = createTaskItem(task, category, done);

  if (done) {
    document.getElementById("doneList").appendChild(li);
  } else {
    const block = createCategoryBlock(category);
    block.querySelector(".category-items").appendChild(li);
  }
}

// チェックで移動
function moveTask(li, done) {
  li.dataset.done = done ? "true" : "false";
  li.querySelector(".task-checkbox").checked = done;

  const category = li.dataset.category || "その他";

  if (done) {
    document.getElementById("doneList").appendChild(li);
  } else {
    const block = createCategoryBlock(category);
    block.querySelector(".category-items").appendChild(li);
  }
}

// 空カテゴリ削除
function cleanEmptyCategories() {
  document.querySelectorAll(".category-block").forEach((block) => {
    const items = block.querySelectorAll("li");
    if (items.length === 0) {
      block.remove();
    }
  });
}

// 保存
function saveTasks() {
  const active = [];
  const done = [];

  document.querySelectorAll(".category-block").forEach((block) => {
    const category = block.dataset.category;
    block.querySelectorAll("li").forEach((li) => {
      active.push({
        category: category,
        text: li.querySelector(".task-text").textContent
      });
    });
  });

  document.querySelectorAll("#doneList li").forEach((li) => {
    done.push({
      category: li.dataset.category || "その他",
      text: li.querySelector(".task-text").textContent
    });
  });

  const data = {
    date: getTodayKey(),
    active: active,
    done: done
  };

  localStorage.setItem(getTaskKey(), JSON.stringify(data));
}

// 読込
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem(getTaskKey()) || '{"active":[],"done":[]}');

  saved.active.forEach((item) => {
    addTaskToCategory(item.category, item.text, false);
  });

  saved.done.forEach((item) => {
    addTaskToCategory(item.category, item.text, true);
  });

  cleanEmptyCategories();
  updateCounts();
  updateNowTask();
}

// タスク追加
function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();

  if (text === "") return;

  const result = transformTask(text);

  result.steps.forEach((step) => {
    addTaskToCategory(result.category, step, false);
  });

  input.value = "";
  saveTasks();
  updateCounts();
  updateNowTask();
}

// カウント更新
function updateCounts() {
  const remaining = document.querySelectorAll(".category-block li").length;
  const done = document.querySelectorAll("#doneList li").length;

  document.getElementById("remainingCount").textContent = remaining;
  document.getElementById("doneCount").textContent = done;
}

// 今やること更新
function updateNowTask() {
  const firstTask = document.querySelector(".category-block .category-items li");
  const nowTaskEl = document.getElementById("nowTask");
  const nowCategoryEl = document.getElementById("nowCategory");

  if (!firstTask) {
    nowTaskEl.textContent = "今日はここまで！";
    nowCategoryEl.textContent = "";
    return;
  }

  const taskText = firstTask.querySelector(".task-text").textContent;
  const category = firstTask.dataset.category || "その他";

  nowTaskEl.textContent = taskText;
  nowCategoryEl.textContent = "カテゴリー: " + category;
}

// 朝チェック保存（今日だけ）
function saveMorningChecks() {
  const states = [];
  document.querySelectorAll(".morning-check").forEach((check) => {
    states.push(check.checked);
  });

  const data = {
    date: getTodayKey(),
    states: states
  };

  localStorage.setItem(getMorningKey(), JSON.stringify(data));
}

// 朝チェック読込（今日だけ）
function loadMorningChecks() {
  const saved = JSON.parse(localStorage.getItem(getMorningKey()) || '{"states":[]}');

  document.querySelectorAll(".morning-check").forEach((check, index) => {
    check.checked = saved.states[index] || false;
    check.onchange = saveMorningChecks;
  });
}

// Enterキーで追加
document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("taskInput");
  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        addTask();
      }
    });
  }
});

// 初期化
window.onload = function () {
  loadTasks();
  loadMorningChecks();
};
