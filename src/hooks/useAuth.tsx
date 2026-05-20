"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { User } from "@/types/jangdokdae";
import { LoginModal } from "@/app/auth/LoginModal";
import { apiFetch, apiFetchJson } from "@/lib/api";

const USER_CACHE_KEY = "jdkd_auth_user";

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isAuthReady: boolean;
  openLoginModal: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // null로 시작해 SSR·hydration 불일치를 방지하고, useLayoutEffect에서 즉시 복원
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => { setUser(readCachedUser()); }, []);

  const updateUser = useCallback((data: User | null) => {
    setUser(data);
    writeCachedUser(data);
  }, []);

  const bfcacheControllerRef = useRef<AbortController | null>(null);

  // 마운트 후 서버에서 실제 인증 상태 재검증 (토큰 갱신 포함)
  useEffect(() => {
    const controller = new AbortController();
    apiFetchJson<User>("/api/v1/auth/me", { signal: controller.signal })
      .then((data: User) => {
        updateUser(data);
        setIsAuthReady(true);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        updateUser(null);
        setIsAuthReady(true);
      });
    return () => controller.abort();
  }, [updateUser]);

  // bfcache 복원 시: localStorage에서 즉시 표시 후 백그라운드 재검증
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;

      // 이전 in-flight bfcache 재검증 요청 취소
      bfcacheControllerRef.current?.abort();
      const controller = new AbortController();
      bfcacheControllerRef.current = controller;

      setUser(readCachedUser());
      setShowModal(false);

      apiFetchJson<User>("/api/v1/auth/me", { signal: controller.signal })
        .then((data: User) => updateUser(data))
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") updateUser(null);
        });
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [updateUser]);

  const logout = async () => {
    await apiFetch("/api/v1/auth/logout", { method: "POST" }).catch((err) =>
      console.error("[Auth] /api/v1/auth/logout 실패:", err),
    );
    updateUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        isAuthReady,
        openLoginModal: () => setShowModal(true),
        logout,
      }}
    >
      {children}
      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
