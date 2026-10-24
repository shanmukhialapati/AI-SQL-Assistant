import { useEffect, useState } from "react";
import { api } from "../api";
import type { QueryResult } from "../types";
import ResultsView from "./ResultsView";

interface Props { seedSql: string; userKey: string; onRan: () => void; tableNames: string[] }

export default function SqlWorkspace({ seedSql, userKey, onRan, tableNames }: Props) {
  const draftKey = `sqldesk_draft_${userKey}`;
  const [question, setQuestion] = useState("");
  const [sql, setSql] = useState(() => localStorage.getItem(draftKey) ?? "");
  const [ranSql, setRanSql] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [beforeFix, setBeforeFix] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep the editor text across refreshes.
  useEffect(() => { localStorage.setItem(draftKey, sql); }, [draftKey, sql]);
  useEffect(() => { if (seedSql) { setSql(seedSql); setExplanation(""); } }, [seedSql]);

  async function guard(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  const ask = () => question.trim() && guard(async () => {
    setError(""); setExplanation(""); setBeforeFix(null);
    try { setSql((await api.generateSql(question)).sql); }
    catch (e) { setError((e as Error).message); }
  });

  const run = () => guard(async () => {
    setError(""); setBeforeFix(null);
    try { setResult(await api.runQuery(sql, question)); setRanSql(sql); onRan(); }
    catch (e) { setError((e as Error).message); setResult(null); }
  });

  const explain = () => guard(async () => {
    setExplanation("");
    try { setExplanation((await api.explainSql(sql)).explanation); }
    catch (e) { setError((e as Error).message); }
  });

  const fix = () => guard(async () => {
    const failing = sql;
    try {
      const res = await api.fixSql(failing, error);
      setBeforeFix(failing); setSql(res.sql); setError("");
    } catch (e) { setError((e as Error).message); }
  });

  async function save() {
    const name = window.prompt("Name this query");
    if (!name?.trim()) return;
    try { await api.saveQuery(name, sql); onRan(); }
    catch (e) { setError((e as Error).message); }
  }

  return (
    <section className="panel">
      <h2><span className="step">2</span>Ask your data</h2>
      <div className="askbar">
        <input
          placeholder="Ask a question about your data…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button className="send" onClick={ask} disabled={busy} title="Write SQL" aria-label="Write SQL">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6" /></svg>
        </button>
      </div>

      {tableNames.length > 0 && (
        <div className="chips">
          {[
            `Show the first 10 rows of ${tableNames[0]}`,
            `How many rows are in ${tableNames[0]}?`,
            `Which columns in ${tableNames[0]} have missing values?`,
          ].map((q) => (
            <button key={q} className="chip" disabled={busy} onClick={() => setQuestion(q)}>{q}</button>
          ))}
        </div>
      )}

      <textarea
        className="editor"
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && sql.trim() && !busy) run(); }}
        spellCheck={false}
        rows={6}
        placeholder="SELECT * FROM your_table LIMIT 10"
        value={sql}
        onChange={(e) => setSql(e.target.value)}
      />
      <div className="row">
        <button className="primary" onClick={run} disabled={busy || !sql.trim()}>Run query</button>
        <button onClick={explain} disabled={busy || !sql.trim()}>Explain</button>
        <button onClick={save} disabled={!sql.trim()}>Save query</button>
        <button onClick={() => { setSql(""); setResult(null); setError(""); setExplanation(""); setBeforeFix(null); }}>Clear</button>
      </div>

      <p className="hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> runs the query. Only read-only SELECT queries are allowed.</p>
      {busy && <p className="status"><span className="spinner" />Working…</p>}

      {error && (
        <div className="error-box">
          <p className="error">{error}</p>
          {sql.trim() && <button onClick={fix} disabled={busy}>Fix with AI</button>}
        </div>
      )}
      {beforeFix !== null && (
        <p className="notice">
          The query was rewritten. Review it, then run it.{" "}
          <button className="plain" onClick={() => { setSql(beforeFix); setBeforeFix(null); }}>Undo</button>
        </p>
      )}
      {explanation && (
        <div className="explain">
          <button className="icon" title="Close" onClick={() => setExplanation("")}>×</button>
          <p>{explanation}</p>
        </div>
      )}

      {result && <ResultsView result={result} sql={ranSql} />}
    </section>
  );
}
