"use client";

/**
 * 관심 프로필(섹터·종목) 상태 관리 훅 및 Provider
 *
 * - 로그인: 마운트 시 서버에서 로드, 저장 시 서버 + localStorage 동기화
 * - 비로그인: localStorage만 사용
 * - 로그아웃: localStorage 클리어 (공유 기기 보호)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import type { InterestProfile } from "@/types/jangdokdae";
import { apiFetch } from "@/lib/api";
import { defaultInterestProfile, interestStorageKey } from "@/lib/jangdokdaeData";
import { useAuth } from "@/hooks/useAuth";

interface InterestProfileContextValue {
  profile: InterestProfile;
  saveProfile: (next: InterestProfile) => Promise<void>;
  isLoading: boolean;
}

const InterestProfileContext = createContext<InterestProfileContextValue | null>(null);
const interestProfileChangedEvent = "jangdokdae.interest-profile.changed";

function readLocalProfile(): InterestProfile {
  if (typeof window === "undefined") return defaultInterestProfile;

  try {
    const stored = window.localStorage.getItem(interestStorageKey);
    if (stored) return JSON.parse(stored) as InterestProfile;
  } catch (err) {
    console.warn("[InterestProfile] localStorage 파싱 실패:", err);
  }
  return defaultInterestProfile;
}

function writeLocalProfile(profile: InterestProfile): void {
  window.localStorage.setItem(interestStorageKey, JSON.stringify(profile));
  window.dispatchEvent(new Event(interestProfileChangedEvent));
}

function clearLocalProfile(): void {
  window.localStorage.removeItem(interestStorageKey);
  window.dispatchEvent(new Event(interestProfileChangedEvent));
}

function subscribeToLocalProfile(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === interestStorageKey) onStoreChange();
  };

  window.addEventListener(interestProfileChangedEvent, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(interestProfileChangedEvent, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function InterestProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const profile = useSyncExternalStore(
    subscribeToLocalProfile,
    readLocalProfile,
    () => defaultInterestProfile,
  );
  const prevIsLoggedIn = useRef<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const prev = prevIsLoggedIn.current;
    prevIsLoggedIn.current = isLoggedIn;

    if (isLoggedIn && user) {
      const serverProfile: InterestProfile = {
        sectors: user.interest_sectors,
        companies: user.interest_companies,
      };
      writeLocalProfile(serverProfile);
    } else {
      // 로그아웃 전환 시 localStorage 클리어
      if (prev === true) clearLocalProfile();
    }
  }, [isLoggedIn, authLoading, user]);

  /**
   * 관심 프로필을 저장한다.
   * 서버 저장 실패 시 예외를 전파해 호출자가 UX를 처리할 수 있게 한다.
   */
  const saveProfile = useCallback(
    async (next: InterestProfile): Promise<void> => {
      writeLocalProfile(next);

      if (isLoggedIn) {
        const res = await apiFetch("/api/v1/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectors: next.sectors, companies: next.companies }),
        });

        if (!res.ok) {
          const msg = `서버 저장 실패 (${res.status})`;
          console.error("[InterestProfile]", msg);
          throw new Error(msg);
        }
      }
    },
    [isLoggedIn],
  );

  return (
    <InterestProfileContext.Provider value={{ profile, saveProfile, isLoading: authLoading }}>
      {children}
    </InterestProfileContext.Provider>
  );
}

export function useInterestProfile() {
  const ctx = useContext(InterestProfileContext);
  if (!ctx) throw new Error("useInterestProfile must be used within InterestProfileProvider");
  return ctx;
}
