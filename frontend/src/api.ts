import type { HistoryItem, PreviewResponse, QueryResult, SavedQuery, TableSummary } from "./types";

const TOKEN_KEY = "sqldesk_token";
export const session = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = session.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join(". ");
    } catch { /* keep statusText */ }
    if (res.status === 401 && token) {
      session.clear();
      window.dispatchEvent(new Event("auth-expired"));
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string; email: string }>("/api/auth/register", json("POST", { email, password })),
  login: (email: string, password: string) =>
    request<{ token: string; email: string }>("/api/auth/login", json("POST", { email, password })),
  me: () => request<{ email: string }>("/api/auth/me"),

  tables: () => request<TableSummary[]>("/api/tables"),
  deleteTable: (name: string) =>
    request<{ deleted: string }>(`/api/tables/${encodeURIComponent(name)}`, { method: "DELETE" }),

  preview: (file: File, sheet?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (sheet) form.append("sheet", sheet);
    return request<PreviewResponse>("/api/uploads/preview", { method: "POST", body: form });
  },
  importFile: (file: File, sheet: string, tableName: string, mode: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sheet", sheet);
    form.append("table_name", tableName);
    form.append("mode", mode);
    return request<{ table: string; rows: number }>("/api/uploads/import", { method: "POST", body: form });
  },

  runQuery: (sql: string, question?: string) =>
    request<QueryResult>("/api/query", json("POST", { sql, question: question || null })),
  generateSql: (question: string) =>
    request<{ sql: string }>("/api/ai/generate-sql", json("POST", { question })),

  explainSql: (sql: string) =>
    request<{ explanation: string }>("/api/ai/explain", json("POST", { sql })),
  fixSql: (sql: string, error: string) =>
    request<{ sql: string }>("/api/ai/fix-sql", json("POST", { sql, error })),

  exportResults: async (sql: string, format: "csv" | "xlsx"): Promise<Blob> => {
    const res = await fetch("/api/query/export", {
      ...json("POST", { sql, format }),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.get()}` },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).detail ?? detail; } catch { /* keep */ }
      throw new Error(typeof detail === "string" ? detail : "Export failed");
    }
    return res.blob();
  },

  history: () => request<HistoryItem[]>("/api/history"),
  clearHistory: () => request<{ cleared: boolean }>("/api/history", { method: "DELETE" }),
  saved: () => request<SavedQuery[]>("/api/saved"),
  saveQuery: (name: string, sql: string) => request<{ id: number }>("/api/saved", json("POST", { name, sql })),
  deleteSaved: (id: number) => request<{ deleted: number }>(`/api/saved/${id}`, { method: "DELETE" }),
};
