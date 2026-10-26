import { useState } from "react";
import { downloadResume } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";
export default function DownloadButton({ id, children = "Download resume ↓" }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useApp();
  async function download() {
    setBusy(true);
    try {
      await downloadResume(id);
    } catch (error) {
      notify(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      className="btn secondary small-btn"
      disabled={busy}
      onClick={download}
    >
      {children}
    </button>
  );
}
