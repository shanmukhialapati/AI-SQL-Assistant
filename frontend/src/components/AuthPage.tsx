import { useState } from "react";
import { api, session } from "../api";

export default function AuthPage({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError("");
    try {
      const res = mode === "login" ? await api.login(email, password) : await api.register(email, password);
      session.set(res.token);
      onSignedIn(res.email);
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="panel auth">
        <span className="orb big" />
        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="muted">
          {mode === "login" ? "Sign in to open your tables and saved queries." : "Your uploads stay private to you."}
        </p>
        <label>Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>
        {mode === "register" && <p className="hint">At least 8 characters.</p>}
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy || !email || !password} onClick={submit}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button className="plain" style={{ textAlign: "center" }} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
        <div className="feature-chips">
          <span>Excel &amp; CSV upload</span><span>Plain English to SQL</span><span>Charts &amp; export</span>
        </div>
      </div>
    </div>
  );
}
