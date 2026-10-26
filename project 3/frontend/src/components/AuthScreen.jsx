import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "./Icon.jsx";
export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  async function submit(body) {
    setBusy(true);
    setError("");
    try {
      const result = await api(`/auth/${mode}`, { method: "POST", body });
      login(result.data);
    } catch (failure) {
      setError(
        [
          failure.message,
          ...(failure.details || []).map((item) => item.message),
        ].join(" "),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <div className="brand">
          <span className="brand-icon">
            <Icon name="chat" />
          </span>
          commonroom<span className="brand-period">.</span>
        </div>
        <span className="eyebrow">A LITTLE CLOSER, WHEREVER YOU ARE</span>
        <h1>
          Good things start
          <br />
          with a <em>conversation.</em>
        </h1>
        <p>
          A place for your team’s ideas, small wins,
          <br />
          and everything in between.
        </p>
        <div className="auth-cards">
          <div className="floating-note">
            <span>✦ A LITTLE SPARK</span>
            <h3>
              What if we built
              <br />
              something together?
            </h3>
            <div className="note-avatars">
              MK <span>TO</span> <span>AL</span>
              <small>Always better together.</small>
            </div>
          </div>
          <div className="floating-reply">
            Sounds like a plan. <span>↗</span>
          </div>
        </div>
        <div className="auth-foot">REAL CONNECTIONS. ROOM TO GROW.</div>
      </div>
      <div className="auth-panel">
        <div className="auth-form">
          <span className="eyebrow">YOUR PEOPLE ARE HERE</span>
          <h2>
            {mode === "login" ? "Welcome back." : "Make yourself at home."}
          </h2>
          <p>
            {mode === "login"
              ? "Pick up the conversation where you left off."
              : "Your next good conversation is one hello away."}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(Object.fromEntries(new FormData(event.currentTarget)));
            }}
          >
            <div className="error" role="alert">
              {error}
            </div>
            {mode === "register" && (
              <>
                <label>
                  Your name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Alex Lee"
                  />
                </label>
                <label>
                  Your handle
                  <input
                    name="handle"
                    required
                    pattern="[a-z][a-z0-9_]{2,29}"
                    placeholder="alex_lee"
                  />
                  <small>Used for @mentions. Lowercase, 3–30 characters.</small>
                </label>
              </>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={mode === "register" ? 8 : 1}
                maxLength={128}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
            </label>
            <button className="button primary wide" disabled={busy}>
              {mode === "login" ? "Step inside →" : "Create your account →"}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New to the room?" : "Already have a seat?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          {mode === "login" && (
            <div className="demo">
              <span>JUST LOOKING AROUND?</span>
              <div>
                <button
                  disabled={busy}
                  onClick={() =>
                    submit({
                      email: "alex@commonroom.demo",
                      password: "DemoPass123!",
                    })
                  }
                >
                  Try as Alex ↗
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    submit({
                      email: "mara@commonroom.demo",
                      password: "DemoPass123!",
                    })
                  }
                >
                  Try as Mara ↗
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
