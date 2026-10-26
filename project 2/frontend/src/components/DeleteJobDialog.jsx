import { useState } from "react";
import { api } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";
import { FormError } from "./Feedback.jsx";
export default function DeleteJobDialog({ job }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { closeModal, navigate, notify } = useApp();
  async function remove() {
    setBusy(true);
    try {
      const result = await api(`/jobs/${job.id}`, { method: "DELETE" });
      navigate("company");
      notify(result.message);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="modal-kicker">DELETE OPPORTUNITY</div>
      <h2 className="modal-title" id="modal-title">
        Remove this role?
      </h2>
      <p className="modal-subtitle">
        This permanently deletes “{job.title}” and all its applications and
        resumes. To keep applications, edit the job and close it instead.
      </p>
      <FormError error={error} />
      <div className="form-actions">
        <button className="btn secondary" disabled={busy} onClick={closeModal}>
          Keep role
        </button>
        <button className="btn danger" disabled={busy} onClick={remove}>
          Delete permanently
        </button>
      </div>
    </>
  );
}
