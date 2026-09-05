import { useQueryClient } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, type Credentials } from "./api";
import type { CurrentUser } from "../../shared/api/generated";

type SessionStatus = "loading" | "ready";

type SessionContextValue = {
  status: SessionStatus;
  user: CurrentUser | null;
  csrfToken: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const logoutEvent = "competition-analysis-logout";

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
      setCsrfToken(response.csrf_token);
    } catch {
      setUser(null);
      setCsrfToken(null);
      queryClient.clear();
    } finally {
      setStatus("ready");
    }
  }

  async function login(credentials: Credentials) {
    const response = await loginUser(credentials);
    setUser(response.user);
    setCsrfToken(response.csrf_token);
    setStatus("ready");
    await queryClient.invalidateQueries();
  }

  async function logout() {
    const token = csrfToken;
    setUser(null);
    setCsrfToken(null);
    queryClient.clear();
    localStorage.setItem(logoutEvent, String(Date.now()));

    try {
      await logoutUser(token);
    } catch {
      return;
    }
  }

  useEffect(() => {
    void refresh();

    function handleStorage(event: StorageEvent) {
      if (event.key !== logoutEvent) {
        return;
      }

      setUser(null);
      setCsrfToken(null);
      queryClient.clear();
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, user, csrfToken, login, logout, refresh }),
    [status, user, csrfToken]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return session;
}
