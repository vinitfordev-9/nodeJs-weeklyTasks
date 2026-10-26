import { useState } from "react";
import { labels } from "../utils/format.js";
export default function JobFilters({ filters, onChange, onClear }) {
  const [tags, setTags] = useState(filters.tags || "");
  return (
    <aside className="filters" aria-label="Filter jobs">
      <div className="filter-heading">
        <h2>Filters</h2>
        <button className="clear-button" onClick={onClear}>
          Clear all
        </button>
      </div>
      {[
        [
          "type",
          "Job type",
          ["full_time", "part_time", "contract", "internship"],
        ],
        ["workMode", "Work style", ["remote", "hybrid", "onsite"]],
      ].map(([key, title, values]) => (
        <fieldset className="filter-group" key={key}>
          <legend>{title}</legend>
          {values.map((value) => (
            <label className="check-row" key={value}>
              <input
                type="radio"
                name={key}
                value={value}
                checked={filters[key] === value}
                onChange={() => onChange({ [key]: value })}
              />
              {labels[value]}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="filter-group">
        <h3>Skills & interests</h3>
        <input
          className="tag-filter"
          aria-label="Filter by skills"
          placeholder="e.g. react, design"
          maxLength={250}
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          onBlur={() => onChange({ tags })}
          onKeyDown={(event) => {
            if (event.key === "Enter") onChange({ tags });
          }}
        />
        <p className="filter-hint">
          Separate skills with commas.
          <br />
          Press Enter to apply.
        </p>
      </div>
      <div className="filter-note">
        <strong>Find your kind of work.</strong>A good fit is more than a job
        title. Explore a little.
      </div>
    </aside>
  );
}
