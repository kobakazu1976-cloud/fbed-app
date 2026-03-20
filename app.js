const MORNING_KEY_PREFIX = "fbed_morning_";
const TASK_KEY_PREFIX = "fbed_tasks_";

// 今日の日付キー
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
      keywords: ["勉強", "問題集", "スタサプ"],
      category: "勉強",
      steps: ["机に座る", "問題集を開く", "1問だけやる", "丸つけする"]
    },
    {
      keywords: ["読書", "本を読む"],
      category: "読書",
      steps: ["本を持つ", "開く", "1ページ読む", "次を読むか決める"]
    },
    {
      keywords: ["日記", "日記を書く"],
      category: "日記",
      steps: ["ノートを出す", "今日のことを1行書く", "気持ちを1つ書く", "閉じる"]
    },
    {
      keywords: ["学校"],
      category: "学校",
      steps: ["カバンを見る", "1つだけ準備する", "全部確認する"]
    },
    {
      keywords: ["塾"],
      category: "塾",
      steps: ["時間を見る", "持ち物を出す", "出発する"]
    },
    {
      keywords: ["進路"],
      category: "進路",
      steps: ["スマホを開く", "1校だけ調べる", "1つメモする"]
    },
    {
      keywords: ["朝食", "朝ごはん"],
      category: "食事",
      steps: ["席に座る", "一口食べる", "飲み物を飲む"]
    },
    {
      keywords: ["ランチ", "昼ごはん"],
      category: "食事",
      steps: ["席に座る", "一口食べる", "5分だけ食べる"]
    },
    {
      keywords: ["夕食", "夜ごはん"],
      category: "食事",
      steps: ["席に座る", "一口食べる", "5分だけ食べる"]
    },
    {
      keywords: ["歯磨き", "はみがき"],
      category: "歯磨き",
      steps: ["洗面所に行く", "歯ブラシを持つ", "10秒磨く"]
    },
    {
      keywords: ["運動"],
      category: "運動",
      steps: ["立つ", "ストレッチ10秒"]
    }
  ];

  for (let rule of rules) {
    for (let k of rule.keywords) {
      if (task.includes(k)) {
        return {
          category: rule.category,
          steps: rule.steps
        };
      }
    }
  }

  return {
    category: "その他",
    steps: ["やる場所に行く", task, "終わったらチェック"]
  };
}

// クイック追加
function quickAdd(text) {
  const input = document.getElementById("taskInput");
  input.value = text;
  addTask();
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

// タスク保存
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

// タスク読込
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

// 朝チェック保存
function saveMorningChecks() {
  const data = [];

  document.querySelectorAll(".morning-check").forEach((check) => {
    const labelText = check.parentElement.querySelector("span").textContent;
    data.push({
      text: labelText,
      checked: check.checked
    });
  });

  localStorage.setItem(getMorningKey(), JSON.stringify(data));
  updateNowTask();
}

// 朝チェック読込
function loadMorningChecks() {
  const saved = JSON.parse(localStorage.getItem(getMorningKey()) || "[]");

  document.querySelectorAll(".morning-check").forEach((check, index) => {
    if (saved[index]) {
      check.checked = saved[index].checked;
    } else {
      check.checked = false;
    }

    check.onchange = function () {
      saveMorningChecks();
      updateNowTask();
    };
  });
}

// 今やること更新
function updateNowTask() {
  const nowTaskEl = document.getElementById("nowTask");
  const nowCategoryEl = document.getElementById("nowCategory");
  const completeBtn = document.getElementById("completeNowBtn");

  const unfinishedMorning = Array.from(document.querySelectorAll(".morning-check"))
    .find((check) => !check.checked);

  if (unfinishedMorning) {
    const text = unfinishedMorning.parentElement.querySelector("span").textContent;
    nowTaskEl.textContent = text;
    nowCategoryEl.textContent = "カテゴリー: 朝のスタート";
    completeBtn.disabled = false;
    completeBtn.dataset.type = "morning";
    completeBtn.dataset.text = text;
    return;
  }

  const firstTask = document.querySelector(".category-block .category-items li");

  if (firstTask) {
    const taskText = firstTask.querySelector(".task-text").textContent;
    const category = firstTask.dataset.category || "その他";
    nowTaskEl.textContent = taskText;
    nowCategoryEl.textContent = "カテゴリー: " + category;
    completeBtn.disabled = false;
    completeBtn.dataset.type = "task";
    completeBtn.dataset.text = taskText;
    return;
  }

  nowTaskEl.textContent = "今日はここまで！";
  nowCategoryEl.textContent = "";
  completeBtn.disabled = true;
  completeBtn.dataset.type = "";
  completeBtn.dataset.text = "";
}

// 今やることを完了
function completeNowTask() {
  const btn = document.getElementById("completeNowBtn");
  const type = btn.dataset.type;
  const text = btn.dataset.text;

  if (!type || !text) return;

  if (type === "morning") {
    const target = Array.from(document.querySelectorAll(".morning-check")).find((check) => {
      const labelText = check.parentElement.querySelector("span").textContent;
      return !check.checked && labelText === text;
    });

    if (target) {
      target.checked = true;
      saveMorningChecks();
      updateNowTask();
    }
    return;
  }

  if (type === "task") {
    const target = Array.from(document.querySelectorAll(".category-block .category-items li")).find((li) => {
      return li.querySelector(".task-text").textContent === text;
    });

    if (target) {
      moveTask(target, true);
      cleanEmptyCategories();
      saveTasks();
      updateCounts();
      updateNowTask();
    }
  }
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
  updateCounts();
  updateNowTask();
};
