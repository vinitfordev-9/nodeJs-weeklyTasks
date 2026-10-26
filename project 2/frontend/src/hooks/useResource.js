import { useEffect, useState } from "react";
import { api } from "../services/api.js";
// Cancel obsolete requests when filters, accounts, or pages change.
export function useResource(path, revision = 0) {
  const [state, setState] = useState({
    data: null,
    meta: null,
    loading: true,
    error: null,
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, meta: null, loading: true, error: null });
    api(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ ...result, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, meta: null, loading: false, error });
      });
    return () => controller.abort();
  }, [path, revision, retry]);
  return { ...state, reload: () => setRetry((value) => value + 1) };
}
