import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { FormError } from "./Feedback.jsx";
export default function AuthForm({ mode = "login" }) {
  const register = mode === "register";
  const [role, setRole] = useState("candidate");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const { openModal, navigate, notify } = useApp();
  async function authenticate(body, endpoint = mode) {
    setBusy(true);
    setError(null);
    try {
      const result = await api(`/auth/${endpoint}`, { method: "POST", body });
      signIn(result.data);
      navigate(result.data.user.role === "company" ? "company" : "jobs");
      notify(result.message);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  function submit(event) {
    event.preventDefault();
    authenticate(Object.fromEntries(new FormData(event.currentTarget)));
  }
  const demo = (company) =>
    authenticate(
      {
        email: company ? "hello@folklore.demo" : "alex@candidate.demo",
        password: "DemoPass123!",
      },
      "login",
    );
  return (
    <>
      <div className="modal-kicker">WELCOME TO ROLE & CO.</div>
      <h2 className="modal-title" id="modal-title">
        {register ? "Let’s start something good." : "Good to see you again."}
      </h2>
      <p className="modal-subtitle">
        {register
          ? "Find your next role. Or your next great teammate."
          : "Sign in and pick up where you left off."}
      </p>
      <form onSubmit={submit}>
        <FormError error={error} />
        {register && (
          <>
            <label className="form-field">
              Your name
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Alex Morgan"
              />
            </label>
            <label className="form-field">
              I’m here to
              <select
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="candidate">Find my next role</option>
                <option value="company">Hire great people</option>
              </select>
            </label>
            {role === "company" && (
              <label className="form-field">
                Company name
                <input
                  name="companyName"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Your company"
                />
              </label>
            )}
          </>
        )}
        <label className="form-field">
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="form-field">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={register ? 8 : 1}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
            placeholder={register ? "At least 8 characters" : "Your password"}
          />
        </label>
        <button className="btn full-btn" disabled={busy} type="submit">
          {register ? "Create account ↗" : "Sign in ↗"}
        </button>
      </form>
      <div className="auth-footer">
        {register ? "Already part of the community?" : "New around here?"}{" "}
        <button
          disabled={busy}
          onClick={() =>
            openModal({ type: "auth", mode: register ? "login" : "register" })
          }
        >
          {register ? "Sign in" : "Create an account"}
        </button>
      </div>
      {!register && (
        <div className="demo-note">
          EXPLORING THE LOCAL DEMO?
          <div className="demo-buttons">
            <button
              className="btn secondary small-btn"
              disabled={busy}
              onClick={() => demo(false)}
            >
              Try candidate
            </button>
            <button
              className="btn secondary small-btn"
              disabled={busy}
              onClick={() => demo(true)}
            >
              Try company
            </button>
          </div>
        </div>
      )}
    </>
  );
}
