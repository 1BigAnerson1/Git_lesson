import "uno.css";
import "@unocss/reset/tailwind.css";
import DOM from "./src/constants/dom";

const KEY_LOCAL_TASKS = "tasks";

const Tags = ["Web", "Update", "Design", "Content"];

class TaskVO {
  static fromJSON(json) {
    return new TaskVO(json.id, json.title, json.date, json.tag);
  }
  constructor(id, title, date, tag) {
    this.id = id;
    this.title = title;
    this.date = date;
    this.tags = tag;
  }
}

const getDOM = (id) => document.getElementById(id);
const QUERY = (container, id) => container.querySelector(`[data-id="${id}"]`);

const domTemplateTask = getDOM(DOM.Template.TASK);
const domTaskColumn = domTemplateTask.parentNode;
domTemplateTask.removeAttribute("id");
domTemplateTask.remove();

const rawTasks = localStorage.getItem(KEY_LOCAL_TASKS);
fetch("http://localhost:3000/tasks")
  .then((response) => {
    return response.ok && response.json();
  })
  .then((rawTasks) => {
    if (rawTasks && rawTasks instanceof Object) {
      console.log("json", rawTasks);
      const serverTasks = rawTasks.map((json) => TaskVO.fromJSON(json));
      serverTasks.forEach((taskVO) => renderTask(taskVO));
      tasks.push(...serverTasks);
    }
  });

const tasks = rawTasks
  ? JSON.parse(rawTasks).map((json) => TaskVO.fromJSON(json))
  : [];
tasks.forEach((taskVO) => renderTask(taskVO));
console.log("> tasks:", tasks);

const taskOperations = {
  [DOM.Template.Task.BTN_DELETE]: (taskVO, domTask) => {
    renderTaskPopup(
      taskVO,
      "Confirm delete task?",
      "Delete",
      (taskTitle, taskDate, taskTag) => {
        console.log("> Delete task -> On Confirm", {
          taskTitle,
          taskDate,
          taskTag,
        });
        const indexOfTask = tasks.indexOf(taskVO);
        tasks.splice(indexOfTask, 1);
        domTaskColumn.removeChild(domTask);
        saveTask();
      }
    );
  },
  [DOM.Template.Task.BTN_EDIT]: (taskVO, domTask) => {
    renderTaskPopup(
      taskVO,
      "Update task",
      "Update",
      (taskTitle, taskDate, taskTag) => {
        console.log("> Update task -> On Confirm", {
          taskTitle,
          taskDate,
          taskTag,
        });
        const indexOfTask = tasks.indexOf(taskVO);
        tasks.splice(tasks.indexOf(taskVO), 1);
        domTaskColumn.replaceChild(domTask);
        saveTask();
      }
    );
  },
};

domTaskColumn.onclick = (e) => {
  e.stopPropagation();
  console.log("domTaskColumn", e.target);
  const domTaskElement = e.target;
  const taskBtn = domTaskElement.dataset.btn;

  const isNotTaskBtn = !taskBtn;
  if (isNotTaskBtn) return;

  const allowedButtons = [
    DOM.Template.Task.BTN_EDIT,
    DOM.Template.Task.BTN_DELETE,
  ];
  if (!allowedButtons.includes(taskBtn)) return;

  let taskId;
  let domTask = domTaskElement;
  do {
    domTask = domTask.parentNode;
    taskId = domTask.dataset.id;
  } while (!taskId);

  const taskVO = tasks.find((task) => task.id === taskId);
  console.log("> taskVO:", taskVO);

  const taskOperation = taskOperations[taskBtn];
  if (taskOperation) {
    taskOperation(taskVO, domTask);
  }
};
getDOM(DOM.Button.CREATE_TASK).onclick = () => {
  console.log("> domPopupCreateTask.classList");
  renderTaskPopup(
    null,
    "Create task",
    "Create",
    (taskTitle, taskDate, taskTag) => {
      console.log("> Create task -> On Confirm", taskTitle);
      const taskId = `task_${Date.now()}`;
      const taskVO = new TaskVO(taskId, taskTitle, taskDate, taskTag);

      renderTask(taskVO);
      tasks.push(taskVO);

      saveTask();
    }
  );
};

function renderTask(taskVO) {
  const domTaskClone = domTemplateTask.cloneNode(true);
  domTaskClone.dataset.id = taskVO.id;
  QUERY(domTaskClone, DOM.Template.Task.TITLE).innerText = taskVO.title;
  domTaskColumn.prepend(domTaskClone);
  return domTaskClone;
}

async function renderTaskPopup(
  taskVO,
  popupTitle,
  confirmText,
  processDataCallback
) {
  const domPopupContainer = getDOM(DOM.Popup.CONTAINER);
  const domSpinner = domPopupContainer.querySelector(".spinner");

  domPopupContainer.classList.remove("hidden");

  const onClosePopup = () => {
    document.onkeyup = null;
    domPopupContainer.children[0].remove();
    domPopupContainer.append(domSpinner);
    domPopupContainer.classList.add("hidden");
  };

  const TaskPopup = (await import("./src/view/popup/TaskPopup")).default;
  const taskPopupInstance = new TaskPopup(
    popupTitle,
    Tags,
    confirmText,
    (taskTitle, taskDate, taskTags) => {
      console.log("Main -> renderTaskPopup: confirmCallback", {
        taskTitle,
        taskDate,
        taskTags,
      });
      processDataCallback(taskTitle, taskDate, taskTags);
      onClosePopup();
    },
    onClosePopup
  );

  if (taskVO) {
    taskPopupInstance.taskTitle = taskVO.title;
  }

  delay(1000).then(() => {
    console.log("render 1");
    domSpinner.remove();
    document.onkeyup = (e) => {
      if (e.key === "Escape") {
        onClosePopup();
      }
    };
    domPopupContainer.append(taskPopupInstance.render());
  });

  console.log("render 0");
}

function saveTask() {
  localStorage.setItem(KEY_LOCAL_TASKS, JSON.stringify(tasks));
}
