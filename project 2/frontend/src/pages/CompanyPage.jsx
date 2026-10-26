import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useResource } from "../hooks/useResource.js";
import { labels } from "../utils/format.js";
import { Loading, EmptyState, ResourceError } from "../components/Feedback.jsx";
import Pagination from "../components/Pagination.jsx";
export default function CompanyPage() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { openModal, revision } = useApp();
  const result = useResource(
    `/company/jobs?page=${page}&limit=10`,
    `${user.id}:${revision}`,
  );
  const jobs = result.data || [];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">COMPANY WORKSPACE</div>
          <h1>Build your next great team.</h1>
          <p>Welcome back, {user.companyName}. Your next hire starts here.</p>
        </div>
        <button className="btn" onClick={() => openModal({ type: "job-form" })}>
          + Post a job
        </button>
      </div>
      {result.loading ? (
        <Loading>Opening your workspace…</Loading>
      ) : result.error ? (
        <ResourceError {...result} />
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <span>Total job postings</span>
              <strong>{result.meta.total}</strong>
            </div>
            <div className="stat">
              <span>Open roles on this page</span>
              <strong>
                {jobs.filter((job) => job.status === "open").length}
              </strong>
            </div>
            <div className="stat">
              <span>Applicants on this page</span>
              <strong>
                {jobs.reduce((sum, job) => sum + job._count.applications, 0)}
              </strong>
            </div>
          </div>
          {jobs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Status</th>
                    <th>Applicants</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <strong>{job.title}</strong>
                        <small>
                          {job.location} · {labels[job.type]}
                        </small>
                      </td>
                      <td>
                        <span className={`pill ${job.status}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="card-link"
                          onClick={() => openModal({ type: "applicants", job })}
                        >
                          {job._count.applications} applicants ↗
                        </button>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn secondary small-btn"
                            onClick={() => openModal({ type: "job-form", job })}
                          >
                            Edit
                          </button>
                          <button
                            className="btn danger small-btn"
                            onClick={() =>
                              openModal({ type: "delete-job", job })
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={
                result.meta.total
                  ? "No more roles on this page."
                  : "Make room for someone great."
              }
              description="Publish your first role and start connecting with candidates."
            >
              <button
                className="btn"
                onClick={() => openModal({ type: "job-form" })}
              >
                Post your first job ↗
              </button>
            </EmptyState>
          )}
          <Pagination meta={result.meta} onChange={setPage} />
        </>
      )}
    </>
  );
}
