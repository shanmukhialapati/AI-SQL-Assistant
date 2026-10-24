import { useRef, useState } from "react";
import { api } from "../api";
import type { PreviewResponse } from "../types";

interface Props { onImported: (table: string, rows: number) => void }

export default function UploadPanel({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [tableName, setTableName] = useState("");
  const [mode, setMode] = useState("fail");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function loadPreview(f: File, sheet?: string) {
    setBusy(true); setError("");
    try {
      const p = await api.preview(f, sheet);
      setFile(f); setPreview(p); setTableName(p.suggested_table);
    } catch (e) {
      setError((e as Error).message); setPreview(null);
    } finally { setBusy(false); }
  }

  async function doImport() {
    if (!file || !preview) return;
    setBusy(true); setError("");
    try {
      const res = await api.importFile(file, preview.sheet, tableName, mode);
      onImported(res.table, res.rows);
      setPreview(null); setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <section className="panel">
      <h2><span className="step">1</span>Add data</h2>

      {!preview && (
        <div
          className={`drop ${dragging ? "drag" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) loadPreview(f);
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
          <p><strong>Drop an Excel or CSV file here</strong></p>
          <p className="muted">or click to browse (.xlsx, .xls, .csv)</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => e.target.files?.[0] && loadPreview(e.target.files[0])}
          />
        </div>
      )}

      {busy && <p className="status"><span className="spinner" />Working…</p>}
      {error && <p className="error">{error}</p>}

      {preview && (
        <div className="import-form">
          <p className="muted">
            {preview.filename} · {preview.row_count.toLocaleString()} rows
            {preview.duplicate_rows > 0 && ` · ${preview.duplicate_rows} duplicate rows`}
          </p>

          <div className="row">
            {preview.sheets.length > 1 && (
              <label>Sheet
                <select value={preview.sheet} onChange={(e) => file && loadPreview(file, e.target.value)}>
                  {preview.sheets.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            )}
            <label>Table name
              <input value={tableName} onChange={(e) => setTableName(e.target.value)} />
            </label>
            <label>If table exists
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="fail">Show an error</option>
                <option value="replace">Replace it</option>
                <option value="append">Append rows</option>
              </select>
            </label>
          </div>

          <div className="scroll">
            <table>
              <thead>
                <tr>{preview.columns.map((c) => (
                  <th key={c.name}>{c.name}<small>{c.type}{c.nulls ? ` · ${c.nulls} empty` : ""}</small></th>
                ))}</tr>
              </thead>
              <tbody>
                {preview.preview.map((r, i) => (
                  <tr key={i}>{preview.columns.map((c) => <td key={c.name}>{String(r[c.name] ?? "")}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row">
            <button className="primary" disabled={busy || !tableName} onClick={doImport}>Import to PostgreSQL</button>
            <button onClick={() => { setPreview(null); setFile(null); }}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
