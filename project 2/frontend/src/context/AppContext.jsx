import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
const AppContext = createContext(null);
export function AppProvider({ children }) {
  const [view, setView] = useState("jobs");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [revision, setRevision] = useState(0);
  const closeModal = useCallback(() => setModal(null), []);
  const notify = useCallback(
    (message, error = false) => setToast({ message, error, id: Date.now() }),
    [],
  );
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  function navigate(next) {
    setView(next);
    closeModal();
    refresh();
  }
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  return (
    <AppContext.Provider
      value={{
        view,
        navigate,
        modal,
        openModal: setModal,
        closeModal,
        toast,
        notify,
        revision,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export const useApp = () => useContext(AppContext);
