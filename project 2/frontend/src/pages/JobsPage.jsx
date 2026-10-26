import { useState } from "react";
import { useResource } from "../hooks/useResource.js";
import { useApp } from "../context/AppContext.jsx";
import Hero from "../components/Hero.jsx";
import Icon from "../components/Icon.jsx";
import JobCard from "../components/JobCard.jsx";
import JobFilters from "../components/JobFilters.jsx";
import Pagination from "../components/Pagination.jsx";
import { Loading, EmptyState, ResourceError } from "../components/Feedback.jsx";
export default function JobsPage() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [reset, setReset] = useState(0);
  const { revision } = useApp();
  const query = new URLSearchParams({
    page,
    limit: 6,
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
  });
  const result = useResource(`/jobs?${query}`, revision);
  function change(values) {
    setFilters((previous) => ({ ...previous, ...values }));
    setPage(1);
  }
  function clear() {
    setFilters({});
    setPage(1);
    setReset((value) => value + 1);
  }
  return (
    <>
      <Hero />
      <form
        className="search-bar"
        key={reset}
        onSubmit={(event) => {
          event.preventDefault();
          change(Object.fromEntries(new FormData(event.currentTarget)));
        }}
      >
        <label className="search-field">
          <Icon name="search" />
          <input
            name="q"
            aria-label="Job title"
            placeholder="Job title or keyword"
            defaultValue={filters.q || ""}
            maxLength={100}
          />
        </label>
        <label className="search-field">
          <Icon name="pin" />
          <input
            name="location"
            aria-label="Location"
            placeholder="City or location"
            defaultValue={filters.location || ""}
            maxLength={100}
          />
        </label>
        <button className="btn" type="submit">
          Find opportunities ↗
        </button>
      </form>
      <div className="board">
        <JobFilters
          key={reset}
          filters={filters}
          onChange={change}
          onClear={clear}
        />
        <section aria-label="Job results">
          <div className="results-top">
            <h2>
              Fresh opportunities{" "}
              <span>{result.meta && `${result.meta.total} open roles`}</span>
            </h2>
            <label className="sort-label">
              Sort by{" "}
              <select
                value={filters.sortBy || "newest"}
                onChange={(event) => change({ sortBy: event.target.value })}
              >
                <option value="newest">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="salary">Highest salary</option>
              </select>
            </label>
          </div>
          <div aria-live="polite">
            {result.loading ? (
              <Loading>Finding opportunities…</Loading>
            ) : result.error ? (
              <ResourceError {...result} />
            ) : result.data.length ? (
              <>
                <div className="job-grid">
                  {result.data.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <Pagination meta={result.meta} onChange={setPage} />
              </>
            ) : (
              <EmptyState
                title="A fresh search, perhaps?"
                description="No roles match these filters yet. Try a broader title, location, or skill."
              >
                <button className="btn secondary" onClick={clear}>
                  Clear filters
                </button>
              </EmptyState>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
