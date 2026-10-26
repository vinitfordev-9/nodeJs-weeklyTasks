export function Loading({ children = "Loading…" }) {
  return (
    <div className="loading" role="status">
      {children}
    </div>
  );
}
export function EmptyState({ title, description, children }) {
  return (
    <div className="empty">
      <div className="empty-symbol">✳</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function FormError({ error }) {
  return (
    <div className="error-box" role="alert">
      {error &&
        [
          error.message,
          ...(error.details || []).map(
            (item) => `${item.field}: ${item.message}`,
          ),
        ].join(" ")}
    </div>
  );
}
export function ResourceError({ error, reload }) {
  return (
    <EmptyState
      title="We couldn’t load this right now"
      description={error.message}
    >
      <button className="btn secondary" onClick={reload}>
        Try again
      </button>
    </EmptyState>
  );
}
