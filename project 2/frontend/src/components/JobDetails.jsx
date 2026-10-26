import { useResource } from "../hooks/useResource.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { labels, salary, timeAgo } from "../utils/format.js";
import CompanyLogo from "./CompanyLogo.jsx";
import { Loading, ResourceError } from "./Feedback.jsx";
export default function JobDetails({ id }) {
  const { data: job, loading, error, reload } = useResource(`/jobs/${id}`);
  const { user } = useAuth();
  const { openModal } = useApp();
  if (loading)
    return (
      <>
        <h2 className="modal-title" id="modal-title">
          Your next opportunity
        </h2>
        <Loading>Loading the details…</Loading>
      </>
    );
  if (error)
    return (
      <>
        <h2 id="modal-title" className="modal-title">
          Unable to open this role
        </h2>
        <ResourceError error={error} reload={reload} />
      </>
    );
  return (
    <>
      <div className="modal-kicker">YOUR NEXT CHAPTER</div>
      <h2 className="modal-title" id="modal-title">
        {job.title}
      </h2>
      <div className="job-detail-company">
        <CompanyLogo company={job.company} />
        <div>
          <strong className="company-name">{job.company.companyName}</strong>
          <div className="posted">{timeAgo(job.createdAt)}</div>
        </div>
      </div>
      <div className="detail-meta">
        <span>{job.location}</span>
        <span>{labels[job.workMode]}</span>
        <span>{labels[job.type]}</span>
        <span>{salary(job)} / year</span>
      </div>
      <div className="tags">
        {job.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <section className="detail-section">
        <h3>About the opportunity</h3>
        <p>{job.description}</p>
      </section>
      <section className="detail-section">
        <h3>What you’ll bring</h3>
        <p>{job.requirements}</p>
      </section>
      <div className="form-actions">
        {job.status === "closed" ? (
          <span className="pill closed">Applications closed</span>
        ) : user?.role === "company" ? (
          <span className="muted">
            Candidate accounts can apply to this role.
          </span>
        ) : (
          <button
            className="btn"
            onClick={() =>
              openModal(
                user ? { type: "apply", job } : { type: "auth", mode: "login" },
              )
            }
          >
            {user ? "Apply for this role ↗" : "Sign in to apply ↗"}
          </button>
        )}
      </div>
    </>
  );
}
