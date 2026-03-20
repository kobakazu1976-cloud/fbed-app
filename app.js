function saveTasks() {
  const items = [];
  document.querySelectorAll("#taskList li").forEach((li) => {
    items.push(li.textContent);
  });
  localStorage.setItem("fbed_tasks", JSON.stringify(items));
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem("fbed_tasks") || "[]");
  saved.forEach((task) => {
    addTaskToList(task);
  });
}

function addTaskToList(task) {
  const li = document.createElement("li");
  li.textContent = task;
  document.getElementById("taskList").appendChild(li);
}

function addTask() {
  const input = document.getElementById("taskInput");
  const task = input.value.trim();

  if (task === "") return;

  addTaskToList(task);
  saveTasks();
  input.value = "";
}

window.onload = function () {
  loadTasks();
};
