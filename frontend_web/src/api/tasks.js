/**
 * Minimal REST client for tasks API.
 *
 * IMPORTANT:
 * In this environment the orchestrator provides `REACT_APP_API_BASE` (not `REACT_APP_API_BASE_URL`).
 * If not set, we fall back to same-origin and likely hit the React dev server, which returns HTML.
 * That HTML response is what produced: Unexpected token '<' ... is not valid JSON
 */

/**
 * Best-effort API base URL resolution.
 * - Prefer the env var used by this project runtime: REACT_APP_API_BASE
 * - Also accept REACT_APP_API_BASE_URL for compatibility with local dev / docs
 */
const API_BASE = (
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_BASE_URL ||
  ""
).replace(/\/$/, "");

function url(path) {
  return `${API_BASE}${path}`;
}

async function safeReadBody(res) {
  // Attempt to read the response body without throwing JSON parse errors.
  // If content-type is JSON -> parse as JSON; else -> return text.
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    try {
      return await res.json();
    } catch (e) {
      const text = await res.text().catch(() => "");
      return { __parse_error: true, __raw: text, __error: String(e) };
    }
  }
  const text = await res.text().catch(() => "");
  return text;
}

function toHelpfulErrorMessage({ method, path, status, body }) {
  // Create a user-facing error without leaking raw HTML into UI.
  // Still keeps enough signal to diagnose incorrect base URL / proxy issues.
  const hint =
    typeof body === "string" && body.trim().startsWith("<!DOCTYPE")
      ? "Received HTML instead of JSON. Check API base URL configuration."
      : "Unexpected response from server.";

  return `${method} ${path} failed (${status}). ${hint}`;
}

async function requestJson(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const res = await fetch(url(path), options);
  const body = await safeReadBody(res);

  if (!res.ok) {
    throw new Error(toHelpfulErrorMessage({ method, path, status: res.status, body }));
  }

  // If we got non-JSON on a success response, still fail gracefully with a clear message.
  if (typeof body === "string") {
    throw new Error(
      `Unexpected non-JSON response for ${method} ${path}. Check API base URL configuration.`
    );
  }

  // If JSON parsing failed but we wrapped it, also fail gracefully.
  if (body && body.__parse_error) {
    throw new Error(
      `Invalid JSON response for ${method} ${path}. Check API base URL configuration.`
    );
  }

  return body;
}

// PUBLIC_INTERFACE
export async function listTasks() {
  /** Fetch all tasks. */
  return requestJson("/tasks");
}

// PUBLIC_INTERFACE
export async function createTask(title) {
  /** Create a new task. */
  return requestJson("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

// PUBLIC_INTERFACE
export async function updateTask(taskId, patch) {
  /** Update title and/or completion state. */
  return requestJson(`/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

// PUBLIC_INTERFACE
export async function toggleTask(taskId) {
  /** Toggle completion state. */
  return requestJson(`/tasks/${taskId}/toggle`, { method: "POST" });
}

// PUBLIC_INTERFACE
export async function deleteTask(taskId) {
  /** Delete a task. */
  const res = await fetch(url(`/tasks/${taskId}`), { method: "DELETE" });
  if (!res.ok) {
    const body = await safeReadBody(res);
    throw new Error(
      toHelpfulErrorMessage({ method: "DELETE", path: `/tasks/${taskId}`, status: res.status, body })
    );
  }
}
