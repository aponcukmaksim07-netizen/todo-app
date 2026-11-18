const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

const db = new Database('task.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    completed INTEGER DEFAULT 0
    )
`);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/tasks - отримати список усіх завдань
app.get('/api/tasks', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM tasks ORDER BY id DESC');
        const rows = stmt.all();
        
        const tasks = rows.map(row => ({
            id: row.id,
            name: row.name,
            completed: Boolean(row.completed)
        }));

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера при отриманні завдань' });
    }
});

// POST /api/tasks - додати нове завдання
app.post('/api/tasks', (req, res) => {
    // Підтримуємо і 'name' (від твого фронта), і 'title' (якщо десь запитували раніше)
    const taskName = req.body.name || req.body.title;

    if (!taskName || typeof taskName !== 'string' || taskName.trim() === '') {
        return res.status(400).json({ error: 'Назва завдання не може бути порожньою' });
    }

    try {
        const cleanName = taskName.trim();
        const isCompleted = req.body.completed ? 1 : 0;

        const stmt = db.prepare('INSERT INTO tasks (name, completed) VALUES (?, ?)');
        const info = stmt.run(cleanName, isCompleted);

        res.status(201).json({
            id: info.lastInsertRowid,
            name: cleanName,
            completed: Boolean(isCompleted)
        });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера при створенні завдання' });
    }
});

// PUT /api/tasks/:id - оновити завдання (для чекбоксів та редагування)
app.post('/api/tasks', (req, res) => {
    const taskName = req.body.name || req.body.title;

    if (!taskName || typeof taskName !== 'string' || taskName.trim() === '') {
        return res.status(400).json({ error: 'Назва завдання не може бути порожньою' });
    }

    try {
        const cleanName = taskName.trim();
        const isCompleted = req.body.completed ? 1 : 0;

        const stmt = db.prepare('INSERT INTO tasks (name, completed) VALUES (?, ?)');
        const info = stmt.run(cleanName, isCompleted);

        res.status(201).json({
            id: info.lastInsertRowid,
            name: cleanName,
            completed: Boolean(isCompleted)
        });
    } catch (err) {
        console.error("ПОМИЛКА БАЗИ ДАНИХ:", err); // <-- Додай цей рядок, щоб побачити суть помилки в терміналі
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/tasks/:id - видалити завдання
app.delete('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Некоректний ID завдання' });
    }

    try {
        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Завдання не знайдено' });
        }

        res.json({ message: 'Завдання видалено', id });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера при видаленні завдання' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});