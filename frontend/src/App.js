import React, { useState, useEffect } from "react";

// ── API Base URL ────────────────────────────
// In Docker: nginx proxies /api → backend container
// So we just use /api (relative URL) — nginx handles the rest
const API = "/api/todos";

// ── Helper: fetch wrapper ───────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | done
  const [loading, setLoading] = useState(true);

  // ── Load todos on page load ───────────────
  useEffect(() => {
    apiFetch(API).then((data) => {
      setTodos(data);
      setLoading(false);
    });
  }, []);

  // ── Create a new todo ─────────────────────
  async function addTodo() {
    if (!input.trim()) return;
    const newTodo = await apiFetch(API, {
      method: "POST",
      body: JSON.stringify({ text: input.trim() }),
    });
    setTodos([newTodo, ...todos]);
    setInput("");
  }

  // ── Toggle completed ──────────────────────
  async function toggleTodo(todo) {
    const updated = await apiFetch(`${API}/${todo._id}`, {
      method: "PUT",
      body: JSON.stringify({ completed: !todo.completed }),
    });
    setTodos(todos.map((t) => (t._id === updated._id ? updated : t)));
  }

  // ── Delete a todo ─────────────────────────
  async function deleteTodo(id) {
    await apiFetch(`${API}/${id}`, { method: "DELETE" });
    setTodos(todos.filter((t) => t._id !== id));
  }

  // ── Filter todos for display ──────────────
  const visible = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0d0d0d;
          --surface: #161616;
          --border: #2a2a2a;
          --accent: #c8f135;
          --accent-dim: #a8d020;
          --text: #f0f0f0;
          --muted: #666;
          --done: #3a3a3a;
          --radius: 12px;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 20px;
        }

        .app {
          width: 100%;
          max-width: 560px;
        }

        /* ── Header ── */
        .header {
          margin-bottom: 48px;
        }

        .header-top {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 6px;
        }

        h1 {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -2px;
          line-height: 1;
        }

        .accent { color: var(--accent); }

        .subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          color: var(--muted);
          letter-spacing: 0.08em;
        }

        .stats {
          display: flex;
          gap: 24px;
          margin-top: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-num {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
          line-height: 1;
        }

        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* ── Input ── */
        .input-row {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }

        input[type="text"] {
          flex: 1;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 18px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }

        input[type="text"]::placeholder { color: var(--muted); }

        input[type="text"]:focus {
          border-color: var(--accent);
        }

        .btn-add {
          background: var(--accent);
          color: #0d0d0d;
          border: none;
          border-radius: var(--radius);
          padding: 14px 22px;
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .btn-add:hover { background: var(--accent-dim); }
        .btn-add:active { transform: scale(0.96); }

        /* ── Filters ── */
        .filters {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
        }

        .filter-btn {
          background: none;
          border: 1.5px solid var(--border);
          border-radius: 100px;
          padding: 6px 16px;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.15s;
        }

        .filter-btn:hover { border-color: var(--accent); color: var(--accent); }

        .filter-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #0d0d0d;
          font-weight: 600;
        }

        /* ── Todo List ── */
        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .todo-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 16px 18px;
          transition: border-color 0.2s, opacity 0.2s;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .todo-item.done {
          opacity: 0.5;
          border-color: var(--done);
        }

        /* Custom checkbox */
        .checkbox {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid var(--border);
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .checkbox:hover { border-color: var(--accent); }

        .checkbox.checked {
          background: var(--accent);
          border-color: var(--accent);
        }

        .checkmark {
          color: #0d0d0d;
          font-size: 0.75rem;
          font-weight: 900;
        }

        .todo-text {
          flex: 1;
          font-size: 0.95rem;
          line-height: 1.4;
          word-break: break-word;
        }

        .todo-item.done .todo-text {
          text-decoration: line-through;
          color: var(--muted);
        }

        .btn-delete {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 1rem;
          padding: 4px 6px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
        }

        .btn-delete:hover { color: #ff5f57; background: #2a1a1a; }

        /* ── Empty state ── */
        .empty {
          text-align: center;
          padding: 48px 20px;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          border: 1.5px dashed var(--border);
          border-radius: var(--radius);
        }

        .empty-icon { font-size: 2rem; margin-bottom: 12px; }

        /* ── Loading ── */
        .loading {
          text-align: center;
          padding: 60px;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
        }
      `}</style>

      <div className="app">
        {/* ── Header ── */}
        <div className="header">
          <div className="header-top">
            <h1>do<span className="accent">.</span></h1>
            <span className="subtitle">// cicd with aws github now with alb</span>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-num">{todos.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-num">{todos.length - doneCount}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat">
              <span className="stat-num">{doneCount}</span>
              <span className="stat-label">Done</span>
            </div>
          </div>
        </div>

        {/* ── Input ── */}
        <div className="input-row">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
          />
          <button className="btn-add" onClick={addTodo}>+</button>
        </div>

        {/* ── Filters ── */}
        <div className="filters">
          {["all", "active", "done"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="loading">connecting to api...</div>
        ) : visible.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◎</div>
            {filter === "done" ? "nothing completed yet" : "no tasks here"}
          </div>
        ) : (
          <div className="todo-list">
            {visible.map((todo) => (
              <div key={todo._id} className={`todo-item ${todo.completed ? "done" : ""}`}>
                {/* Checkbox */}
                <div
                  className={`checkbox ${todo.completed ? "checked" : ""}`}
                  onClick={() => toggleTodo(todo)}
                >
                  {todo.completed && <span className="checkmark">✓</span>}
                </div>

                {/* Text */}
                <span className="todo-text">{todo.text}</span>

                {/* Delete */}
                <button className="btn-delete" onClick={() => deleteTodo(todo._id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
