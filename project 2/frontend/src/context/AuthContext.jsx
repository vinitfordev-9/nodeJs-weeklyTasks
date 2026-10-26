import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, saveToken } from "../services/api.js";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    if (getToken()) {
      api("/auth/me", { signal: controller.signal })
        .then((result) => {
          if (!controller.signal.aborted) setUser(result.data);
        })
        .catch((error) => {
          if (error.name !== "AbortError") setUser(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    } else setLoading(false);
    return () => {
      controller.abort();
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  function signIn(data) {
    saveToken(data.token);
    setUser(data.user);
  }
  async function signOut() {
    if (getToken()) await api("/auth/logout", { method: "POST" });
    saveToken(null);
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
