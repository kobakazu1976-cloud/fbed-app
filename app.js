const MORNING_KEY_PREFIX = "fbed_morning_";
const TASK_KEY_PREFIX = "fbed_tasks_";
const FEEDBACK_KEY_PREFIX = "fbed_feedback_";

// あなたのVercel API URL
const AI_API_URL = "https://fbed-ai-api.vercel.app/api/plan-task";

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

function getFeedbackKey() {
  return FEEDBACK_KEY_PREFIX + getTodayKey();
}

// ------------------------------
// AIが使えない時の予備ルール
// ------------------------------
function fallbackTransformTask(task) {
  const rules = [
    {
      keywords: ["問題集"],
      category: "勉強",
      steps: [
        "机に座る",
        "問題集を出す",
        "問題集を開く",
        "1問ずつ進める",
        "丸つけする",
        "問題集を片付ける"
      ]
    },
    {
      keywords: ["宿題"],
      category: "勉強",
      steps: [
        "宿題を出す",
        "やるページを確認する",
        "1つずつ終わらせる",
        "丸つけする",
        "ランドセルに入れる"
      ]
    },
    {
      keywords: ["スタサプ"],
      category: "勉強",
      steps: [
        "机に座る",
        "タブレットかPCを開く",
        "スタサプを開く",
        "今日やる授業を見る",
        "最後までやる",
        "終わったら閉じる"
      ]
    },
    {
      keywords: ["英会話"],
      category: "勉強",
      steps: [
        "英会話の準備をする",
        "教材を開く",
        "最初のあいさつをする",
        "最後まで参加する",
        "終わったら片付ける"
      ]
    },
    {
      keywords: ["勉強"],
      category: "勉強",
      steps: [
        "机に座る",
        "今日やるものを1つ決める",
        "最初の1つを始める",
        "終わったらチェックする"
      ]
    },
    {
      keywords: ["読書", "本を読む"],
      category: "読書",
      steps: [
        "本を持つ",
        "開く",
        "今日の目標ページまで読む",
        "本を片付ける"
      ]
    },
    {
      keywords: ["日記", "日記を書く"],
      category: "日記",
      steps: [
        "日記帳を出す",
        "今日のことを1行書く",
        "気持ちを1つ書く"
      ]
    },
    {
      keywords: ["学校"],
      category: "学校",
      steps: [
        "支度をする",
        "忘れ物・未完了の宿題がないか確認",
        "出発する"
      ]
    },
    {
      keywords: ["塾"],
      category: "塾",
      steps: [
        "塾の宿題が終わっているか確認",
        "塾に向かって出発する",
        "塾代を回収のため超絶学ぶ"
      ]
    },
    {
      keywords: ["進路"],
      category: "進路",
      steps: [
        "スマホを開く",
        "1校だけ調べる",
        "1つメモする",
        "親にわかりやすく簡潔に説明する"
      ]
    },
    {
      keywords: ["朝食", "朝ごはん", "昼食", "ランチ", "夕食", "夕飯"],
      category: "食事",
      steps: [
        "席に座る",
        "食べる",
        "飲み物を飲む"
      ]
    },
    {
      keywords: ["歯磨き", "はみがき"],
      category: "歯磨き",
      steps: [
        "洗面所に行く",
        "歯ブラシを持つ",
        "10秒磨く"
      ]
    },
    {
      keywords: ["運動"],
      category: "運動",
      steps: [
        "準備運動",
        "運動する",
        "ストレッチ10秒"
      ]
    },
    {
      keywords: ["掃除機", "皿洗い", "風呂掃除"],
      category: "お手伝い",
      steps: [
        "掃除機",
        "皿洗い",
        "風呂掃除"
      ]
    },
    {
      keywords: ["寝る", "就寝", "寝る前"],
      category: "寝る",
      steps: [
        "寝る前の歯磨き",
        "薬を飲む",
        "電気を消す"
      ]
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
    steps: [
      "やる場所に行く",
      task,
      "終わったらチェック"
    ]
  };
}

// ------------------------------
// コメント保存
// ------------------------------
function saveFeedback() {
  const input = document.getElementById("feedbackInput");
  if (!input) return;

  const text = input.value.trim();
  localStorage.setItem(getFeedbackKey(), text);
  alert("コメントを保存したよ");
}

function getLatestFeedback() {
  return localStorage.getItem(getFeedbackKey()) || "";
}

// ------------------------------
// 音声読み上げ
// ------------------------------
function speakNowTask() {
  const voiceToggle = document.getElementById("voiceToggle");
  if (voiceToggle && !voiceToggle.checked) return;

  const nowTaskEl = document.getElementById("nowTask");
  if (!nowTaskEl) return;

  const text = nowTaskEl.textContent.trim();

  if (!text || text === "まだありません" || text === "今日はここまで！") {
    return;
  }

  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("ja"));
  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// iPhone/Safari対策で音声一覧を先に読み込む
function warmUpVoices() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
}

// ------------------------------
// AIでタスク分解
// ------------------------------
async function generateTaskFromAI(task, feedback = "") {
  const res = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      task: task,
      feedback: feedback
    })
  });

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status}`);
  }

  const data = await res.json();

  if (!data.category || !Array.isArray(data.steps)) {
    throw new Error("AI response format invalid");
  }

  return data;
}

// ------------------------------
// クイック追加
// ------------------------------
function quickAdd(text) {
  const input = document.getElementById("taskInput");
  input.value = text;
  addTask();
}

// ------------------------------
// カテゴリブロック作成
// ------------------------------
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

// ------------------------------
// タスク行作成
// ------------------------------
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

// ------------------------------
// タスク追加
// ------------------------------
function addTaskToCategory(category, task, done = false) {
  const li = createTaskItem(task, category, done);

  if (done) {
    document.getElementById("doneList").appendChild(li);
  } else {
    const block = createCategoryBlock(category);
    block.querySelector(".category-items").appendChild(li);
  }
}

// ------------------------------
// チェックで移動
// ------------------------------
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

// ------------------------------
// 空カテゴリ削除
// ------------------------------
function cleanEmptyCategories() {
  document.querySelectorAll(".category-block").forEach((block) => {
    const items = block.querySelectorAll("li");
    if (items.length === 0) {
      block.remove();
    }
  });
}

// ------------------------------
// タスク保存
// ------------------------------
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

// ------------------------------
// タスク読込
// ------------------------------
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

// ------------------------------
// タスク追加（AI使用）
// ------------------------------
async function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();

  if (text === "") return;

  const originalButton = document.querySelector('.task-row button');
  if (originalButton) {
    originalButton.disabled = true;
    originalButton.textContent = "AI考え中...";
  }

  try {
    const feedback = getLatestFeedback();
    const result = await generateTaskFromAI(text, feedback);

    result.steps.forEach((step) => {
      addTaskToCategory(result.category, step, false);
    });
  } catch (error) {
    console.error("AI error:", error);

    const fallback = fallbackTransformTask(text);
    fallback.steps.forEach((step) => {
      addTaskToCategory(fallback.category, step, false);
    });
  } finally {
    input.value = "";
    saveTasks();
    updateCounts();
    updateNowTask();

    if (originalButton) {
      originalButton.disabled = false;
      originalButton.textContent = "追加";
    }
  }
}

// ------------------------------
// カウント更新
// ------------------------------
function updateCounts() {
  const remaining = document.querySelectorAll(".category-block li").length;
  const done = document.querySelectorAll("#doneList li").length;

  document.getElementById("remainingCount").textContent = remaining;
  document.getElementById("doneCount").textContent = done;
}

// ------------------------------
// 朝チェック保存
// ------------------------------
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

// ------------------------------
// 朝チェック読込
// ------------------------------
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

// ------------------------------
// 今やること更新
// ------------------------------
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
    speakNowTask();
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
    speakNowTask();
    return;
  }

  nowTaskEl.textContent = "今日はここまで！";
  nowCategoryEl.textContent = "";
  completeBtn.disabled = true;
  completeBtn.dataset.type = "";
  completeBtn.dataset.text = "";
}

// ------------------------------
// 今やることを完了
// ------------------------------
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

// ------------------------------
// Enterキーで追加
// ------------------------------
document.addEventListener("DOMContentLoaded", function () {
  warmUpVoices();

  const input = document.getElementById("taskInput");
  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        addTask();
      }
    });
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = function () {
      warmUpVoices();
    };
  }
});

// ------------------------------
// 初期化
// ------------------------------
window.onload = function () {
  loadTasks();
  loadMorningChecks();
  updateCounts();
  updateNowTask();
};
