document.addEventListener('DOMContentLoaded', function () {
  const API_URL = "/api/tasks";
  
  const todoInput = document.getElementById('todo-input');
  const addBtn = document.getElementById('add-btn');

  const activeList = document.getElementById('active-list');
  const completedList = document.getElementById('completed-list');

  const taskCounter = document.getElementById('task-counter');
  const clearBtn = document.getElementById('clear-completed-btn');

  const activeEmpty = document.getElementById('active-empty');
  const completedEmpty = document.getElementById('completed-empty');

  let tasks = [];

  //================================
  // = Отримання завдань з сервера =
  //================================

  async function fetchTasks() {
    try {
      const response = await fetch(API_URL);
      if(!response.ok) {
        throw new Error(`Помилка сервера: ${response.status}`);
      }
      tasks = await response.json();
      renderTasks();
    } catch (error) {
      console.error(`Не вдалося завантажити завдання: ${error.message}`);
    }
  }

  //================================
  // = Додавання завдань на сервер =
  //================================

  async function addTaskToServer(text) {
    if (!text.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
          name: text.trim(),
          completed: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Помилка додавання: ${response.status}`);
      }

      todoInput.value = '';
      addBtn.classList.remove('visible');
      await fetchTasks();
    } catch (error) {
      console.error("Помилка додавання:", error);
      alert(`Не вдалося додати завдання: ${error.message}`);
    }
  }

  //==========================================
  // = Оновлення завдання (статус або текст) =
  //==========================================

  async function updateTaskOnServer(id, updateData) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if(!response.ok) {
        throw new Error(`Помилка оновлення: ${response.status}`);
      }

      await fetchTasks();
    } catch (error) {
      console.error("Помилка оновлення:", error);
      alert(`Не вдалося оновити завдання: ${error.message}`);
    }
  }

  //=============================
  // = Видалення завдання за ID =
  //=============================

  async function deleteTaskFromServer(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if(!response.ok) {
        throw new Error(`Помилка видалення: ${response.status}`);
      }

      await fetchTasks();
    } catch (error) {
      console.error("Помилка видалення:", error);
      alert(`Не вдалося видалити завдання: ${error.message}`);
    }
  }

  //========================
  // = Інтерфейс та рендер =
  //========================

  function updateCounter() {
    let active = 0;
    let completed = 0;

    tasks.forEach(function (task) {
      if(task.completed) {
        completed++;
      } else {
        active++;
      }
    });

    taskCounter.textContent = 
      `Усього: ${tasks.length} / Активні: ${active} / Виконані: ${completed}`;

    if (clearBtn) {
      clearBtn.disabled = completed === 0;
    }
  }

  function renderTasks() {
    activeList.innerHTML = '';
    completedList.innerHTML = '';

    tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.className = 'todo-item';

      if(task.completed) {
        li.classList.add('completed');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', 'Позначити завдання: ' + task.name);

      checkbox.addEventListener('change', function() {
        updateTaskOnServer(task.id, {
          name: task.name,
          completed: checkbox.checked
        });
      });

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = task.name;

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Редагувати';

      editBtn.addEventListener('click', function() {
        const newText = prompt('Введіть текст:', task.name);

        if(newText !== null && newText.trim() !== '') {
          updateTaskOnServer(task.id, {
            name: newText.trim(),
            completed: task.completed
          });
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Видалити';

      deleteBtn.addEventListener('click', function() {
        deleteTaskFromServer(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      if(task.completed) {
        completedList.appendChild(li);
      } else {
        activeList.appendChild(li);
      }
    });

    if (activeEmpty) activeEmpty.hidden = activeList.children.length > 0;
    if (completedEmpty) completedEmpty.hidden = completedList.children.length > 0;

    updateCounter();
  }

  //========================
  // = Події форми =
  //========================

  todoInput.addEventListener('input', function () {
    if (todoInput.value.trim() !== '') {
      addBtn.classList.add('visible');
    } else {
      addBtn.classList.remove('visible');
    }
  });

  addBtn.addEventListener('click', function () {
    addTaskToServer(todoInput.value);
  });

  todoInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTaskToServer(todoInput.value);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', async function () {
      const completedTasks = tasks.filter(task => task.completed === true || task.completed === "true");

      if (completedTasks.length === 0) return;

      clearBtn.disabled = true;

      try {
        for (const task of completedTasks) {
          const response = await fetch(`${API_URL}/${task.id}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error(`Помилка видалення ID: ${task.id}`);
          }
        }
        await fetchTasks();
      } catch (error) {
        console.error("Помилка очищення:", error);
        alert(`Не вдалося очистити виконані завдання: ${error.message}`);
      } finally {
        clearBtn.disabled = false;
      }
    });
  }

  //Запуск
  fetchTasks();
});