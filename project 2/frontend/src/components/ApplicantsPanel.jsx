import { useState } from "react";
import { api } from "../services/api.js";
import { useResource } from "../hooks/useResource.js";
import { useApp } from "../context/AppContext.jsx";
import { formatDate } from "../utils/format.js";
import { Loading, ResourceError, EmptyState } from "./Feedback.jsx";
import Pagination from "./Pagination.jsx";
import DownloadButton from "./DownloadButton.jsx";
function ApplicantCard({ application }) {
  const [status, setStatus] = useState(application.status);
  const [busy, setBusy] = useState(false);
  const { notify } = useApp();
  async function change(next) {
    setBusy(true);
    try {
      const result = await api(`/applications/${application.id}/status`, {
        method: "PATCH",
        body: { status: next },
      });
      setStatus(result.data.status);
      notify(result.message);
    } catch (error) {
      notify(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="applicant">
      <div className="applicant-header">
        <div>
          <h3>{application.candidate.name}</h3>
          <p>
            {application.candidate.email}
            <br />
            Applied {formatDate(application.createdAt)}
          </p>
        </div>
        <label className="form-field">
          Review status
          <select
            value={status}
            disabled={busy}
            data-status-id={application.id}
            data-previous={status}
            onChange={(event) => change(event.target.value)}
          >
            {["submitted", "reviewing", "shortlisted", "rejected"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
      </div>
      {application.coverLetter && <p>{application.coverLetter}</p>}
      <DownloadButton id={application.id} />
    </article>
  );
}
export default function ApplicantsPanel({ job }) {
  const [page, setPage] = useState(1);
  const result = useResource(
    `/jobs/${job.id}/applications?page=${page}&limit=5`,
  );
  return (
    <>
      <div className="modal-kicker">PEOPLE & POSSIBILITIES</div>
      <h2 className="modal-title" id="modal-title">
        Meet your applicants.
      </h2>
      <p className="modal-subtitle">
        {job.title}
        {result.meta && ` · ${result.meta.total} applications`}
      </p>
      {result.loading ? (
        <Loading>Opening applications…</Loading>
      ) : result.error ? (
        <ResourceError {...result} />
      ) : result.data.length ? (
        <>
          {result.data.map((application) => (
            <ApplicantCard key={application.id} application={application} />
          ))}
          <Pagination meta={result.meta} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="Your next teammate is out there."
          description="Applications will appear here as candidates discover your role."
        />
      )}
    </>
  );
}
