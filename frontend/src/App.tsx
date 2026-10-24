import { useCallback, useEffect, useState } from "react";
import { api, session } from "./api";
import type { TableSummary } from "./types";
import AuthPage from "./components/AuthPage";
import UploadPanel from "./components/UploadPanel";
import TablesSidebar from "./components/TablesSidebar";
import SavedPanel from "./components/SavedPanel";
import SqlWorkspace from "./components/SqlWorkspace";

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(!!session.get());

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!session.get()) return;
    api
      .me()
      .then((u) => setEmail(u.email))
      .catch(() => setEmail(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setEmail(null);
    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, []);

  if (checking) return <p className="muted center">Loading…</p>;
  if (!email) return <AuthPage onSignedIn={setEmail} />;
  return (
    <Workspace
      email={email}
      onSignOut={() => {
        session.clear();
        setEmail(null);
      }}
    />
  );
}

function Workspace({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [seedSql, setSeedSql] = useState("");
  const [savedTick, setSavedTick] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    try {
      setTables(await api.tables());
      setError("");
    } catch (e) {
      setError(`Cannot load tables: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const rawName = email.split("@")[0].split(/[._\-\d]/)[0] || "there";
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const totalRows = tables.reduce((n, t) => n + t.rows, 0);

  const select = (t: string) => setSeedSql(`SELECT * FROM "${t}" LIMIT 100`);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="orb" />
          <h1>AI SQL Desk</h1>
        </div>
        <span className="grow" />
        <div className="who">
          <span className="avatar">{email[0]}</span>
          <span className="email">{email}</span>
        </div>
        <button onClick={onSignOut}>Sign out</button>
      </header>
      {error && <p className="error banner">{error}</p>}
      <div className="layout">
        <div className="side">
          <TablesSidebar
            tables={tables}
            onPick={select}
            onDelete={async (t) => {
              await api.deleteTable(t);
              refresh();
            }}
          />
          <SavedPanel refreshKey={savedTick} onPick={setSeedSql} />
        </div>
        <main>
          <section className="hero">
            <div className="hero-text">
              <span className="orb big" />
              <h2>
                {greeting}, {name}
              </h2>
              <span className="muted">{today}</span>
            </div>
            <div className="stat">
              <strong>Your workspace</strong>
              <div className="nums">
                <div>
                  <b>{tables.length}</b>
                  <span>tables</span>
                </div>
                <div>
                  <b>{totalRows.toLocaleString()}</b>
                  <span>rows stored</span>
                </div>
              </div>
              <div className="bar">
                <i style={{ width: tables.length ? "100%" : "6%" }} />
              </div>
            </div>
          </section>
          <UploadPanel
            onImported={(t, rows) => {
              refresh();
              select(t);
              setToast(`Imported ${rows.toLocaleString()} rows into "${t}"`);
              setTimeout(() => setToast(""), 3500);
            }}
          />
          <SqlWorkspace
            seedSql={seedSql}
            userKey={email}
            tableNames={tables.map((t) => t.name)}
            onRan={() => setSavedTick((n) => n + 1)}
          />
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
