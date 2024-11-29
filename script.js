let todos = JSON.parse(localStorage.getItem('todos')) || [];
let categories = new Set(['feature', 'bug', 'refactor', 'docs', 'testing']);
document.getElementById('categorySelect').addEventListener('change', function (e) {
    const customInput = document.getElementById('customCategory');
    customInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
    if (e.target.value === 'custom') {
        customInput.focus();
    }
});

function addTodo() {
    const input = document.getElementById('todoInput');
    const categorySelect = document.getElementById('categorySelect');
    const customCategory = document.getElementById('customCategory');
    const priority = document.getElementById('prioritySelect').value;

    let category = categorySelect.value;
    if (category === 'custom' && customCategory.value.trim()) {
        category = customCategory.value.trim().toLowerCase();
        if (!categories.has(category)) {
            categories.add(category);
            updateCategorySelect();
        }
    }

    if (input.value.trim()) {
        const todo = {
            id: Date.now(),
            text: input.value,
            category,
            priority,
            completed: false,
            timestamp: new Date().toISOString(),
            edited: false
        };

        todos.push(todo);
        saveTodos();
        renderTodos();
        input.value = '';
        customCategory.value = '';
        categorySelect.value = 'feature';
        customCategory.style.display = 'none';
    }
}

function updateCategorySelect() {
    const select = document.getElementById('categorySelect');
    const currentValue = select.value;
    select.innerHTML = Array.from(categories)
        .sort()
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('') + '<option value="custom">+ Custom</option>';
    select.value = currentValue;
}

function toggleTodo(id) {
    todos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

function editCategory(id) {
    const todo = todos.find(t => t.id === id);
    const selectElement = document.querySelector(`select[onchange="editCategory(${id})"]`);
    const newCategory = selectElement.value;

    if (newCategory && newCategory !== 'custom' && newCategory !== todo.category) {
        todo.category = newCategory;
        todo.timestamp = new Date().toISOString();
        todo.edited = true; 
        saveTodos();
        renderTodos();
    }
}

function updateLineNumbers() {
    const todoCount = todos.length;
    const lineNumbers = document.querySelector('.line-numbers');
    lineNumbers.innerHTML = Array.from({ length: todoCount + 10 }, (_, i) =>
        `<div style="color: var(--line-numbers); padding: 0 0.5rem; text-align: right; font-size: 0.8rem;">
            ${i + 1}
        </div>`
    ).join('');
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    const todoElement = document.querySelector(`[data-todo-id="${id}"]`);
    const editForm = 
        `<div class="edit-form">
            <input type="text" class="edit-input" value="${todo.text}" />
            <select class="edit-category">
                ${Array.from(categories)
                    .map(cat => `<option value="${cat}" ${cat === todo.category ? 'selected' : ''}>${cat}</option>`)
                    .join('')}
            </select>
            <select class="edit-priority">
                <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>High</option>
                <option value="urgent" ${todo.priority === 'urgent' ? 'selected' : ''}>🔥 Urgent</option>
            </select>
            <button onclick="saveEdit(${id})">Save</button>
            <button onclick="renderTodos()" class="cancel-btn">Cancel</button>
        </div>`;
    todoElement.innerHTML = editForm;
}

const originalRenderTodos = renderTodos;
renderTodos = function () {
    originalRenderTodos();
    updateLineNumbers();
};

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    updateStats();
}

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const byCategory = todos.reduce((acc, todo) => {
        acc[todo.category] = (acc[todo.category] || 0) + 1;
        return acc;
    }, {});
    const byPriority = todos.reduce((acc, todo) => {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1;
        return acc;
    }, {});

    document.getElementById('stats').innerHTML = 
        `<span class="comment">/* Statistics */</span><br>
        <div><span class="status-indicator pending"></span>Total Tasks: ${total}</div>
        <div><span class="status-indicator completed"></span>Completed: ${completed}</div>
        <div><span class="status-indicator pending"></span>Pending: ${pending}</div>
        <br>
        <span class="comment">/* By Category */</span><br>
        ${Object.entries(byCategory)
            .map(([category, count]) => `${category}: ${count}`)
            .join('<br>')}
        <br><br>
        <span class="comment">/* By Priority */</span><br>
        ${Object.entries(byPriority)
            .map(([priority, count]) => `${priority}: ${count}`)
            .join('<br>')}`;
}

function renderTodos() {
    const todoList = document.getElementById('todoList');

    if (todos.length === 0) {
        todoList.innerHTML = 
            `<div class="empty-state">
                <div class="code-block">
                    <span class="comment">// No todos found</span><br>
                    <span class="keyword">const</span> <span class="variable">developer</span> = {<br>
                    &nbsp;&nbsp;status: <span class="string">"relaxing"</span>,<br>
                    &nbsp;&nbsp;todos: <span class="number">[]</span>,<br>
                    &nbsp;&nbsp;coffee: <span class="string">"needed"</span><br>
                    };<br><br>
                    <span class="comment">// Add your first task above! ☝️</span>
                </div>
            </div>`;
        return;
    }

    todoList.innerHTML = todos
        .sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        })
        .map((todo, index) => 
            `<li class="todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
                <div class="todo-content">
                    <div onclick="toggleTodo(${todo.id})" style="cursor: pointer;">
                        ${todo.text}
                    </div>
                    <div class="todo-meta">
                        ${todo.category} | Priority: ${todo.priority} | 
                        ${new Date(todo.timestamp).toLocaleString()}${todo.edited ? ' // Edited' : ''}
                    </div>
                </div>
                <div class="actions">
                    <button class="icon-button edit-btn" onclick="editTodo(${todo.id})" title="Edit">
                        ✏️
                    </button>
                    <select onchange="editCategory(${todo.id})">
                        ${Array.from(categories)
                        .map(cat => `<option value="${cat}" ${cat === todo.category ? 'selected' : ''}>${cat}</option>`)
                        .join('')}
                    </select>
                    <button class="icon-button delete-btn" onclick="deleteTodo(${todo.id})" title="Delete">
                        🗑️
                    </button>
                </div>
            </li>`
        ).join('');

    updateStats();
}

document.getElementById('todoInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});

function saveEdit(id) {
    const todoElement = document.querySelector(`[data-todo-id="${id}"]`);
    const editInput = todoElement.querySelector('.edit-input');
    const editCategory = todoElement.querySelector('.edit-category');
    const editPriority = todoElement.querySelector('.edit-priority');

    todos = todos.map(todo => {
        if (todo.id === id) {
            return {
                ...todo,
                text: editInput.value,
                category: editCategory.value,
                priority: editPriority.value,
                timestamp: new Date().toISOString(),
                edited: true
            };
        }
        return todo;
    });

    saveTodos();
    renderTodos();
}

renderTodos();