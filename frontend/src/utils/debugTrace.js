const STORAGE_KEY = "ss_debug_eb2ffb";
const INGEST =
  "http://127.0.0.1:7940/ingest/5fbd08cc-3488-41f0-9341-717aeb89cc4b";

/** Append a debug trace entry (sessionStorage for mobile; ingest for local). */
export function debugTrace(hypothesisId, location, message, data = {}) {
  const entry = { hypothesisId, location, message, data, timestamp: Date.now() };
  try {
    const prev = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    prev.push(entry);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(-25)));
  } catch {
    /* ignore */
  }
  // #region agent log
  fetch(INGEST, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "eb2ffb" },
    body: JSON.stringify({
      sessionId: "eb2ffb",
      runId: "run1",
      hypothesisId,
      location,
      message,
      data,
      timestamp: entry.timestamp,
    }),
  }).catch(() => {});
  // #endregion
}

export function clearDebugTrace() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getDebugTraceSummary() {
  try {
    const entries = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    return entries
      .slice(-6)
      .map((e) => `${e.location}:${e.message}`)
      .join(" → ");
  } catch {
    return "";
  }
}
