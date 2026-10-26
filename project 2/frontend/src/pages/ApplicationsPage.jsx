import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useResource } from "../hooks/useResource.js";
import { formatDate } from "../utils/format.js";
import { Loading, EmptyState, ResourceError } from "../components/Feedback.jsx";
import CompanyLogo from "../components/CompanyLogo.jsx";
import DownloadButton from "../components/DownloadButton.jsx";
import Pagination from "../components/Pagination.jsx";
export default function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { navigate, revision } = useApp();
  const result = useResource(
    `/applications/me?page=${page}&limit=10`,
    `${user.id}:${revision}`,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR JOURNEY</div>
          <h1>Good things are in motion.</h1>
          <p>Every application is a step forward. Keep track of yours here.</p>
        </div>
        <button className="btn secondary" onClick={() => navigate("jobs")}>
          Explore roles ↗
        </button>
      </div>
      {result.loading ? (
        <Loading>Opening your applications…</Loading>
      ) : result.error ? (
        <ResourceError {...result} />
      ) : result.data.length ? (
        <>
          {result.data.map((application) => (
            <article className="application-card" key={application.id}>
              <CompanyLogo company={application.job.company} />
              <div>
                <h3>{application.job.title}</h3>
                <p>
                  {application.job.company.companyName} ·{" "}
                  {application.job.location}
                </p>
                <p>Applied {formatDate(application.createdAt)}</p>
              </div>
              <div className="right">
                <span className={`pill ${application.status}`}>
                  {application.status}
                </span>
                <div>
                  <DownloadButton id={application.id}>
                    My resume ↓
                  </DownloadButton>
                </div>
              </div>
            </article>
          ))}
          <Pagination meta={result.meta} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="Your possibilities are waiting."
          description="Find a role that speaks to you and send your first application."
        >
          <button className="btn" onClick={() => navigate("jobs")}>
            Discover jobs ↗
          </button>
        </EmptyState>
      )}
    </>
  );
}
