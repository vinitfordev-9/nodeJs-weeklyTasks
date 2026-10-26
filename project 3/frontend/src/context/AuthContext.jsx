import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../services/api.js";
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    if (getToken())
      api("/auth/me")
        .then((result) => {
          if (active) setUser(result.data);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    else setLoading(false);
    return () => {
      active = false;
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  function login(data) {
    setToken(data.token);
    setUser(data.user);
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setToken(null);
    setUser(null);
  }
  return (
    <Context.Provider value={{ user, loading, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
