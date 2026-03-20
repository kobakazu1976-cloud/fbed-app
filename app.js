const TASK_KEY = "fbed_tasks_v2";
const MORNING_KEY = "fbed_morning_checks_v1";

function transformTask(task) {
  const rules = [
    { keyword: "勉強", steps: ["机に座る", "教科書を開く", "1ページだけやる"] },
    { keyword: "宿題", steps: ["宿題を出す", "1問だけやる", "終わったらしまう"] },
    { keyword: "学校", steps: ["必要なものを出す", "1つだけ準備する", "終わったら確認する"] },
    { keyword: "仕事", steps: ["PCを開く", "メールを1通確認", "5分だけやる"] },
    { keyword: "掃除", steps: ["1ヶ所だけ片付ける", "ゴミを1つ捨てる"] },
    { keyword: "運動", steps: ["立ち上がる", "ストレッチ10秒"] }
  ];

  for (let rule of rules) {
    if (task.includes(rule.keyword)) {
      return rule.steps;
    }
  }

  return ["やる場所に行く", task, "終わったらチェックする"];
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li, #doneList li").forEach((li) => {
    tasks.push({
      text: li.querySelector(".task-text").textContent,
      done: li.querySelector(".task-checkbox").checked
    });
  });
  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem(TASK_KEY) || "[]");
  saved.forEach((task) => {
    addTaskToList(task.text, task.done);
  });
  updateCounts();
}

function addTaskToList(task, done = false) {
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
    document.getElementById("taskList").appendChild(li);
  }
}

function moveTask(li, done) {
  if (done) {
    document.getElementById("doneList").appendChild(li);
  } else {
    document.getElementById("taskList").appendChild(li);
  }
}

function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (text === "") return;

  const steps = transformTask(text);
  steps.forEach(step => addTaskToList(step, false));

  input.value = "";
  saveTasks();
  updateCounts();
}

function updateCounts() {
  const remaining = document.querySelectorAll("#taskList li").length;
  const done = document.querySelectorAll("#doneList li").length;

  document.getElementById("remainingCount").textContent = remaining;
  document.getElementById("doneCount").textContent = done;
}

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

window.onload = function () {
  loadTasks();
  loadMorningChecks();
};
