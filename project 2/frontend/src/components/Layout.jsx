import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import Icon from "./Icon.jsx";
export function SignOutButton({ className = "btn ghost" }) {
  const { signOut } = useAuth();
  const { navigate, notify } = useApp();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await signOut();
      navigate("jobs");
      notify("You have signed out. See you soon.");
    } catch (error) {
      notify(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button className={className} disabled={busy} onClick={logout}>
      Sign out
    </button>
  );
}
export default function Layout({ children }) {
  const { user, loading } = useAuth();
  const { view, navigate, openModal, toast } = useApp();
  const links = [
    ["jobs", "search", "Discover jobs"],
    ["applications", "briefcase", "My applications"],
    ["company", "grid", "Company workspace"],
  ];
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#jobs"
          onClick={(event) => {
            event.preventDefault();
            navigate("jobs");
          }}
        >
          <span className="brand-mark">r.</span>role & co
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">YOUR NEXT CHAPTER</div>
        <nav aria-label="Main navigation">
          {links.map(([key, icon, name]) => (
            <button
              key={key}
              className={`nav-item ${view === key ? "active" : ""}`}
              onClick={() => navigate(key)}
            >
              <Icon name={icon} />
              {name}
              {key === "jobs" && <span className="nav-arrow">↗</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="little-star">✳</span>
          <h3>
            Good work.
            <br />
            Great company.
          </h3>
          <p>Your next opportunity starts with a little curiosity.</p>
          <button
            className="text-button"
            onClick={() =>
              user
                ? navigate("jobs")
                : openModal({ type: "auth", mode: "register" })
            }
          >
            Find your people <span>↗</span>
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" />A little ambition goes a long way.
          <div className="small">ROLE & CO. / JOB BOARD</div>
        </div>
      </aside>
      <div className="shell">
        <header className="topbar">
          <span className="breadcrumb">
            Your career, with intention <span>✳</span>
          </span>
          <div id="account-actions">
            {loading ? (
              <span className="muted">Loading account…</span>
            ) : user ? (
              <>
                <div className="account-name">
                  <span className="avatar">{user.name[0].toUpperCase()}</span>
                  {user.name}
                  <span className="role-label">
                    {user.role === "company" ? user.companyName : "Candidate"}
                  </span>
                </div>
                <SignOutButton />
              </>
            ) : (
              <>
                <button
                  className="btn ghost"
                  onClick={() => openModal({ type: "auth", mode: "login" })}
                >
                  Sign in
                </button>
                <button
                  className="btn"
                  onClick={() => openModal({ type: "auth", mode: "register" })}
                >
                  Get started ↗
                </button>
              </>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer>
          Made for the next step.<span>Role & Co. ↗</span>
        </footer>
      </div>
      <div
        id="toast"
        role="status"
        aria-live="polite"
        className={toast ? `show${toast.error ? " error" : ""}` : ""}
      >
        {toast?.message}
      </div>
    </>
  );
}
