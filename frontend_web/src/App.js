import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createTask, deleteTask, listTasks, toggleTask, updateTask } from "./api/tasks";

function sortTasks(tasks) {
  // Completed tasks go to bottom; otherwise newer first by id.
  return [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return b.id - a.id;
  });
}

// PUBLIC_INTERFACE
function App() {
  /** Main SPA for managing tasks (CRUD). */
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const remainingCount = useMemo(
    () => tasks.filter((t) => !t.is_completed).length,
    [tasks]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        setLoading(true);
        const data = await listTasks();
        if (!cancelled) setTasks(sortTasks(data));
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load tasks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    try {
      setError("");
      const created = await createTask(title);
      setTasks((prev) => sortTasks([created, ...prev]));
      setNewTitle("");
    } catch (e2) {
      setError(e2.message || "Failed to create task.");
    }
  }

  async function handleToggle(id) {
    try {
      setError("");
      const updated = await toggleTask(id);
      setTasks((prev) => sortTasks(prev.map((t) => (t.id === id ? updated : t))));
    } catch (e) {
      setError(e.message || "Failed to toggle task.");
    }
  }

  function beginEdit(task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveEdit(taskId) {
    const title = editingTitle.trim();
    if (!title) return;

    try {
      setError("");
      const updated = await updateTask(taskId, { title });
      setTasks((prev) => sortTasks(prev.map((t) => (t.id === taskId ? updated : t))));
      cancelEdit();
    } catch (e) {
      setError(e.message || "Failed to update task.");
    }
  }

  async function handleDelete(taskId) {
    try {
      setError("");
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (editingId === taskId) cancelEdit();
    } catch (e) {
      setError(e.message || "Failed to delete task.");
    }
  }

  return (
    <div className="App">
      <div className="Page">
        <header className="Header">
          <div>
            <h1 className="Title">Tasks</h1>
            <p className="Subtitle">
              {remainingCount} remaining • {tasks.length} total
            </p>
          </div>
          <div className="HeaderHint">
            Backend: <code>/tasks</code>
          </div>
        </header>

        <main className="Main">
          <section className="Card">
            <form className="AddForm" onSubmit={handleAdd}>
              <label className="Label" htmlFor="new-task">
                Add a task
              </label>
              <div className="AddRow">
                <input
                  id="new-task"
                  className="Input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Buy groceries"
                  autoComplete="off"
                />
                <button className="Button ButtonPrimary" type="submit" disabled={!newTitle.trim()}>
                  Add
                </button>
              </div>
            </form>

            {error ? (
              <div className="Error" role="alert">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="EmptyState">Loading…</div>
            ) : tasks.length === 0 ? (
              <div className="EmptyState">No tasks yet. Add your first one above.</div>
            ) : (
              <ul className="List" aria-label="Task list">
                {tasks.map((task) => (
                  <li key={task.id} className="ListItem">
                    <button
                      type="button"
                      className={`Checkbox ${task.is_completed ? "CheckboxChecked" : ""}`}
                      aria-label={task.is_completed ? "Mark as incomplete" : "Mark as complete"}
                      onClick={() => handleToggle(task.id)}
                    />
                    <div className="TaskBody">
                      {editingId === task.id ? (
                        <div className="EditRow">
                          <input
                            className="Input"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            aria-label="Edit task title"
                          />
                          <button
                            type="button"
                            className="Button ButtonPrimary"
                            onClick={() => saveEdit(task.id)}
                            disabled={!editingTitle.trim()}
                          >
                            Save
                          </button>
                          <button type="button" className="Button" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className={`TaskTitle ${task.is_completed ? "TaskDone" : ""}`}>
                            {task.title}
                          </div>
                          <div className="TaskMeta">
                            #{task.id}
                          </div>
                        </>
                      )}
                    </div>

                    {editingId !== task.id ? (
                      <div className="Actions">
                        <button type="button" className="Button" onClick={() => beginEdit(task)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="Button ButtonDanger"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="Actions">
                        <button
                          type="button"
                          className="Button ButtonDanger"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <footer className="Footer">
          <span>
            Tip: set <code>REACT_APP_API_BASE_URL</code> to your backend URL (e.g. :3001).
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
