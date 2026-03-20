function addTask() {
  const input = document.getElementById("taskInput");
  const task = input.value;

  // 空なら何もしない
  if (task === "") return;

  // リストに追加
  const li = document.createElement("li");
  li.textContent = task;

  document.getElementById("taskList").appendChild(li);

  // 入力リセット
  input.value = "";
}
