import { useApp } from "../context/AppContext.jsx";
import { labels, timeAgo, salary } from "../utils/format.js";
import CompanyLogo from "./CompanyLogo.jsx";
import Icon from "./Icon.jsx";
export default function JobCard({ job }) {
  const { openModal } = useApp();
  const open = () => openModal({ type: "detail", id: job.id });
  return (
    <article className="job-card">
      <div className="card-top">
        <CompanyLogo company={job.company} />
        <div>
          <div className="company-name">{job.company.companyName}</div>
          <div className="posted">{timeAgo(job.createdAt)}</div>
        </div>
        <span className="card-badge">HIRING</span>
      </div>
      <h3>
        <button className="title-button" onClick={open}>
          {job.title}
        </button>
      </h3>
      <div className="job-location">
        <Icon name="pin" />
        {job.location}
        <span>· {labels[job.type]}</span>
      </div>
      <div className="tags">
        <span className="tag mode">{labels[job.workMode]}</span>
        {job.tags.slice(0, 3).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="card-bottom">
        <div className="salary">
          {salary(job)} <span>/ year</span>
        </div>
        <button
          className="card-link"
          onClick={open}
          aria-label={`View ${job.title} at ${job.company.companyName}`}
        >
          View role <span>↗</span>
        </button>
      </div>
    </article>
  );
}
