import { useApp } from "./context/AppContext.jsx";
import Layout from "./components/Layout.jsx";
import RoleGuard from "./components/RoleGuard.jsx";
import ModalHost from "./components/ModalHost.jsx";
import JobsPage from "./pages/JobsPage.jsx";
import CompanyPage from "./pages/CompanyPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
export default function App() {
  const { view } = useApp();
  return (
    <Layout>
      {view === "jobs" && <JobsPage />}
      {view === "company" && (
        <RoleGuard role="company">
          <CompanyPage />
        </RoleGuard>
      )}
      {view === "applications" && (
        <RoleGuard role="candidate">
          <ApplicationsPage />
        </RoleGuard>
      )}
      <ModalHost />
    </Layout>
  );
}
