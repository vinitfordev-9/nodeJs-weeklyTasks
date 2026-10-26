export default function Pagination({ meta, onChange }) {
  if (!meta || meta.totalPages < 2) return null;
  return (
    <div className="pagination">
      <span>
        Page <span className="page-number">{meta.page}</span> of{" "}
        {meta.totalPages} · {meta.total} results
      </span>
      <div className="buttons">
        <button
          className="btn secondary small-btn"
          disabled={!meta.hasPreviousPage}
          onClick={() => onChange(meta.page - 1)}
        >
          ← Previous
        </button>
        <button
          className="btn secondary small-btn"
          disabled={!meta.hasNextPage}
          onClick={() => onChange(meta.page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
