const TASK_KEY = "fbed_tasks_v4";
const MORNING_KEY = "fbed_morning_checks_v1";

// ADHD向けの変換ルール
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

// カテゴリブロックを作る
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

// タスク行を作る
function createTaskItem(task, done = false) {
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
    cleanEmptyCategories();
    saveTasks();
    updateCounts();
  };

  checkbox.onchange = function () {
    moveTask(li, checkbox.checked);
    cleanEmptyCategories();
    saveTasks();
    updateCounts();
  };

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  return li;
}

// カテゴリの中にタスクを追加
function addTaskToCategory(category, task, done = false) {
  const li = createTaskItem(task, done);

  if (done) {
    document.getElementById("doneList").appendChild(li);
  } else {
    const block = createCategoryBlock(category);
    block.querySelector(".category-items").appendChild(li);
  }
}

// チェックしたら doneList に移動
function moveTask(li, done) {
  if (done) {
    document.getElementById("doneList").appendChild(li);
  } else {
    // 戻す場合はその他に戻す
    const block = createCategoryBlock("その他");
    block.querySelector(".category-items").appendChild(li);
  }
}

// 空カテゴリを消す
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

    data.push({
      category: category,
      items: items
    });
  });

  document.querySelectorAll("#doneList li").forEach((li) => {
    data.push({
      category: "__done__",
      items: [
        {
          text: li.querySelector(".task-text").textContent,
          done: true
        }
      ]
    });
  });

  localStorage.setItem(TASK_KEY, JSON.stringify(data));
}

// タスク読込
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem(TASK_KEY) || "[]");

  saved.forEach((group) => {
    if (group.category === "__done__") {
      group.items.forEach((item) => {
        addTaskToCategory("done", item.text, true);
      });
    } else {
      group.items.forEach((item) => {
        addTaskToCategory(group.category, item.text, item.done);
      });
    }
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
  const states = [];
  document.querySelectorAll(".morning-check").forEach((check) => {
    states.push(check.checked);
  });
  localStorage.setItem(MORNING_KEY, JSON.stringify(states));
}

// 朝チェック読込
function loadMorningChecks() {
  const saved = JSON.parse(localStorage.getItem(MORNING_KEY) || "[]");
  document.querySelectorAll(".morning-check").forEach((check, index) => {
    check.checked = saved[index] || false;
    check.onchange = saveMorningChecks;
  });
}

// 初期化
window.onload = function () {
  loadTasks();
  loadMorningChecks();
};
