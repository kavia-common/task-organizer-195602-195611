/**
 * Minimal REST client for tasks API.
 * Uses REACT_APP_API_BASE_URL when set, otherwise defaults to same-origin (proxy).
 */

const API_BASE = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

function url(path) {
  return `${API_BASE}${path}`;
}

// PUBLIC_INTERFACE
export async function listTasks() {
  /** Fetch all tasks. */
  const res = await fetch(url("/tasks"));
  if (!res.ok) {
    throw new Error(`Failed to list tasks (${res.status})`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function createTask(title) {
  /** Create a new task. */
  const res = await fetch(url("/tasks"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create task (${res.status})`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function updateTask(taskId, patch) {
  /** Update title and/or completion state. */
  const res = await fetch(url(`/tasks/${taskId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Failed to update task (${res.status})`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function toggleTask(taskId) {
  /** Toggle completion state. */
  const res = await fetch(url(`/tasks/${taskId}/toggle`), { method: "POST" });
  if (!res.ok) {
    throw new Error(`Failed to toggle task (${res.status})`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function deleteTask(taskId) {
  /** Delete a task. */
  const res = await fetch(url(`/tasks/${taskId}`), { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Failed to delete task (${res.status})`);
  }
}
