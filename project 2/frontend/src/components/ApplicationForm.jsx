import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { FormError } from "./Feedback.jsx";
import Icon from "./Icon.jsx";
export default function ApplicationForm({ job }) {
  const { user } = useAuth();
  const { closeModal, navigate, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const body = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      if (body.get("resume").size > 5 * 1024 * 1024)
        throw new Error("Please choose a PDF smaller than 5 MB.");
      await api(`/jobs/${job.id}/applications`, { method: "POST", body });
      setSubmitted(true);
      refresh();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  if (submitted)
    return (
      <div className="success-block">
        <div className="success-icon">✓</div>
        <div className="modal-kicker">ONE STEP CLOSER</div>
        <h2 className="modal-title" id="modal-title">
          You’re in the running.
        </h2>
        <p>
          Your application is with the team.
          <br />
          Follow its progress in My applications.
        </p>
        <button className="btn" onClick={() => navigate("applications")}>
          View my applications ↗
        </button>
      </div>
    );
  return (
    <>
      <div className="modal-kicker">MAKE YOUR NEXT MOVE</div>
      <h2 className="modal-title" id="modal-title">
        A little introduction.
      </h2>
      <p className="modal-subtitle">
        Apply for {job.title} at {job.company.companyName} as {user.name}.
      </p>
      <form onSubmit={submit}>
        <FormError error={error} />
        <label className="form-field">
          Your resume
          <div className="upload-zone">
            <Icon name="upload" />
            <strong>Put your experience on paper.</strong>
            <p>PDF only · Up to 5 MB · Shared only with this company</p>
            <input
              type="file"
              name="resume"
              accept="application/pdf,.pdf"
              required
              aria-label="Upload PDF resume"
            />
          </div>
        </label>
        <label className="form-field">
          A note to the team <small>Optional</small>
          <textarea
            name="coverLetter"
            maxLength={3000}
            placeholder="What draws you to this opportunity?"
          />
        </label>
        <div className="form-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={closeModal}
          >
            Not now
          </button>
          <button className="btn" disabled={busy} type="submit">
            Send application ↗
          </button>
        </div>
      </form>
    </>
  );
}
