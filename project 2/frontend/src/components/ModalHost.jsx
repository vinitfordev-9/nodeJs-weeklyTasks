import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext.jsx";
import AuthForm from "./AuthForm.jsx";
import JobDetails from "./JobDetails.jsx";
import ApplicationForm from "./ApplicationForm.jsx";
import JobForm from "./JobForm.jsx";
import ApplicantsPanel from "./ApplicantsPanel.jsx";
import DeleteJobDialog from "./DeleteJobDialog.jsx";
function Dialog({ children }) {
  const ref = useRef(null);
  const { closeModal } = useApp();
  useEffect(() => {
    const element = ref.current;
    element.showModal();
    document.body.classList.add("no-scroll");
    return () => {
      element.close();
      document.body.classList.remove("no-scroll");
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        closeModal();
      }}
    >
      <button
        className="close-modal"
        aria-label="Close dialog"
        onClick={closeModal}
      >
        ×
      </button>
      {children}
    </dialog>
  );
}
export default function ModalHost() {
  const { modal } = useApp();
  if (!modal) return null;
  const content = {
    auth: <AuthForm mode={modal.mode} />,
    detail: <JobDetails id={modal.id} />,
    apply: <ApplicationForm job={modal.job} />,
    "job-form": <JobForm job={modal.job} />,
    applicants: <ApplicantsPanel job={modal.job} />,
    "delete-job": <DeleteJobDialog job={modal.job} />,
  }[modal.type];
  return (
    <Dialog
      key={`${modal.type}:${modal.mode || modal.id || modal.job?.id || "new"}`}
    >
      {content}
    </Dialog>
  );
}
