import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { HistoryItem, SavedQuery } from "../types";

interface Props { refreshKey: number; onPick: (sql: string) => void }

export default function SavedPanel({ refreshKey, onPick }: Props) {
  const [tab, setTab] = useState<"saved" | "history">("saved");
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([api.saved(), api.history()]);
      setSaved(s); setHistory(h);
    } catch { /* shown elsewhere */ }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <section className="sidebar">
      <div className="tabs">
        <button className={tab === "saved" ? "on" : ""} onClick={() => setTab("saved")}>Saved</button>
        <button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>History</button>
      </div>

      {tab === "saved" && (
        <>
          {saved.length === 0 && <p className="muted">Nothing saved yet. Write a query, then choose Save query.</p>}
          <ul>
            {saved.map((q) => (
              <li key={q.id}>
                <button className="link" onClick={() => onPick(q.sql)}><span>{q.name}</span></button>
                <button className="icon" title="Delete" onClick={async () => { await api.deleteSaved(q.id); load(); }}>×</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "history" && (
        <>
          {history.length === 0 && <p className="muted">Queries you run will show up here.</p>}
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                <button className="link" onClick={() => onPick(h.sql)}>
                  <span className="clip">{h.question || h.sql}</span>
                  <small>{new Date(h.created_at).toLocaleString()}</small>
                </button>
              </li>
            ))}
          </ul>
          {history.length > 0 && <button className="plain" onClick={async () => { await api.clearHistory(); load(); }}>Clear history</button>}
        </>
      )}
    </section>
  );
}
