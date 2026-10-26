import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { EmptyState, Loading } from "./Feedback.jsx";
import { SignOutButton } from "./Layout.jsx";
export default function RoleGuard({ role, children }) {
  const { user, loading } = useAuth();
  const { openModal } = useApp();
  if (loading) return <Loading>Opening your workspace…</Loading>;
  if (!user)
    return (
      <EmptyState
        title={
          role === "company"
            ? "A home for your hiring."
            : "Your next chapter starts here."
        }
        description={`Sign in as a ${role} to access your workspace.`}
      >
        <button
          className="btn"
          onClick={() => openModal({ type: "auth", mode: "login" })}
        >
          Sign in to continue ↗
        </button>
      </EmptyState>
    );
  if (user.role !== role)
    return (
      <EmptyState
        title={`This space is for ${role} accounts.`}
        description={`You are signed in as a ${user.role}. Use the appropriate account to access this space.`}
      >
        <SignOutButton className="btn secondary" />
      </EmptyState>
    );
  return children;
}
