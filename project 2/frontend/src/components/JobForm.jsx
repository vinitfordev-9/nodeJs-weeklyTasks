import { useState } from "react";
import { api } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";
import { labels } from "../utils/format.js";
import { FormError } from "./Feedback.jsx";
function Options({ values }) {
  return values.map((value) => (
    <option key={value} value={value}>
      {labels[value] || value.toUpperCase()}
    </option>
  ));
}
export default function JobForm({ job = {} }) {
  const { closeModal, refresh, notify } = useApp();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.tags = body.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    ["salaryMin", "salaryMax"].forEach((key) => {
      body[key] = body[key] === "" ? null : Number(body[key]);
    });
    setBusy(true);
    setError(null);
    try {
      const result = await api(`/jobs${job.id ? `/${job.id}` : ""}`, {
        method: job.id ? "PATCH" : "POST",
        body,
      });
      refresh();
      closeModal();
      notify(result.message);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="modal-kicker">MAKE ROOM FOR GREAT PEOPLE</div>
      <h2 className="modal-title" id="modal-title">
        {job.id ? "Refine the opportunity." : "A new role. A new possibility."}
      </h2>
      <p className="modal-subtitle">
        Give candidates a clear picture of the work and the team.
      </p>
      <form onSubmit={submit}>
        <FormError error={error} />
        <div className="form-grid">
          <label className="form-field full">
            Job title
            <input
              name="title"
              required
              minLength={3}
              maxLength={150}
              defaultValue={job.title || ""}
              placeholder="e.g. Senior Product Designer"
            />
          </label>
          <label className="form-field">
            Location
            <input
              name="location"
              required
              minLength={2}
              maxLength={150}
              defaultValue={job.location || ""}
              placeholder="e.g. Bengaluru, India"
            />
          </label>
          <label className="form-field">
            Work style
            <select name="workMode" defaultValue={job.workMode || "hybrid"}>
              <Options values={["hybrid", "remote", "onsite"]} />
            </select>
          </label>
          <label className="form-field">
            Job type
            <select name="type" defaultValue={job.type || "full_time"}>
              <Options
                values={["full_time", "part_time", "contract", "internship"]}
              />
            </select>
          </label>
          <label className="form-field">
            Currency
            <select name="currency" defaultValue={job.currency || "INR"}>
              <Options values={["INR", "USD", "EUR", "GBP"]} />
            </select>
          </label>
          <label className="form-field">
            Minimum annual salary
            <input
              name="salaryMin"
              type="number"
              min={0}
              max={1000000000}
              step={1}
              defaultValue={job.salaryMin ?? ""}
              placeholder="Optional"
            />
          </label>
          <label className="form-field">
            Maximum annual salary
            <input
              name="salaryMax"
              type="number"
              min={0}
              max={1000000000}
              step={1}
              defaultValue={job.salaryMax ?? ""}
              placeholder="Optional"
            />
          </label>
          <label className="form-field full">
            About the role
            <textarea
              name="description"
              required
              minLength={30}
              maxLength={15000}
              defaultValue={job.description || ""}
              placeholder="The work, the impact, and what makes this opportunity special…"
            />
          </label>
          <label className="form-field full">
            What candidates should bring
            <textarea
              name="requirements"
              required
              minLength={10}
              maxLength={10000}
              defaultValue={job.requirements || ""}
              placeholder="Skills, experience, and the qualities that matter…"
            />
          </label>
          <label className="form-field full">
            Skills & tags
            <input
              name="tags"
              defaultValue={(job.tags || []).join(", ")}
              placeholder="design, figma, research"
            />
            <small>Up to 8 tags, separated by commas.</small>
          </label>
          {job.id && (
            <label className="form-field full">
              Applications
              <select name="status" defaultValue={job.status}>
                <option value="open">Open — accepting applications</option>
                <option value="closed">Closed — no new applications</option>
              </select>
            </label>
          )}
        </div>
        <div className="form-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={closeModal}
          >
            Cancel
          </button>
          <button className="btn" type="submit" disabled={busy}>
            {job.id ? "Save changes" : "Publish opportunity ↗"}
          </button>
        </div>
      </form>
    </>
  );
}
