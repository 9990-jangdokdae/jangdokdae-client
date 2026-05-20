"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInterestProfile } from "@/hooks/useInterestProfile";
import {
  getIssueDocentSearchSuggestions,
  ISSUE_DOCENT_SEARCH_MAX_LENGTH,
} from "@/lib/issueDocent";
import { ONBOARDING_INITIAL_PROFILE } from "@/lib/jangdokdaeData";
import type { InterestProfile } from "@/types/jangdokdae";
import { LogoutConfirmModal } from "@/app/auth/LogoutConfirmModal";
import { OnboardingModal } from "@/app/onboarding/OnboardingModal";
import { BrandMark } from "@/components/ui/BrandMark";
import { UserMenuDropdown } from "@/components/ui/UserMenuDropdown";
import type { IssueDocentSearchSuggestion } from "@/types/issueDocent";

const navItems = ["오늘의 독해", "이슈", "마켓 정보"] as const;
const navHrefs = ["/", "/issue-docent", "/market/indices"] as const;
const suggestionTypeLabels: Record<IssueDocentSearchSuggestion["type"], string> = {
  company: "종목",
  sector: "섹터",
  issue: "이슈",
};

export function Header({
  activeIndex,
  searchQuery = "",
}: {
  activeIndex: 0 | 1 | 2;
  searchQuery?: string;
}) {
  const router = useRouter();
  const { isLoggedIn, user, openLoginModal, logout } = useAuth();
  const { profile, saveProfile } = useInterestProfile();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [draftProfile, setDraftProfile] = useState<InterestProfile>(ONBOARDING_INITIAL_PROFILE);
  const [suggestions, setSuggestions] = useState<IssueDocentSearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionAbortRef = useRef<AbortController | null>(null);
  const currentSearchQuery = activeIndex === 1 ? searchQuery : "";

  const hasInterests = profile.sectors.length > 0 || profile.companies.length > 0;

  // bfcache 복원 시 로컬 모달 상태 리셋
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setShowLogoutConfirm(false);
      setShowOnboarding(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const openOnboarding = () => {
    setDraftProfile(hasInterests ? profile : ONBOARDING_INITIAL_PROFILE);
    setShowOnboarding(true);
  };

  const completeOnboarding = async () => {
    try {
      await saveProfile(draftProfile);
      setShowOnboarding(false);
    } catch {
      alert("프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const clearSuggestionRequest = () => {
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
      suggestionTimerRef.current = null;
    }
    suggestionAbortRef.current?.abort();
    suggestionAbortRef.current = null;
  };

  useEffect(
    () => () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
      suggestionAbortRef.current?.abort();
    },
    [],
  );

  const searchPath = (query: string) => `/issue-docent?q=${encodeURIComponent(query)}`;

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim().slice(0, ISSUE_DOCENT_SEARCH_MAX_LENGTH);

    clearSuggestionRequest();
    setSuggestions([]);
    setIsSuggestionsOpen(false);
    router.push(query ? searchPath(query) : "/issue-docent");
  };

  const requestSuggestions = (rawQuery: string) => {
    const query = rawQuery.trim().slice(0, ISSUE_DOCENT_SEARCH_MAX_LENGTH);
    clearSuggestionRequest();

    if (!query) {
      setSuggestions([]);
      setIsSuggesting(false);
      setIsSuggestionsOpen(false);
      return;
    }

    setIsSuggesting(true);
    setIsSuggestionsOpen(true);
    suggestionTimerRef.current = setTimeout(() => {
      const controller = new AbortController();
      suggestionAbortRef.current = controller;

      void getIssueDocentSearchSuggestions(query, { signal: controller.signal })
        .then((response) => {
          if (controller.signal.aborted) return;
          setSuggestions(response.suggestions);
          setIsSuggesting(false);
          setIsSuggestionsOpen(true);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setIsSuggesting(false);
          setIsSuggestionsOpen(false);
        });
    }, 200);
  };

  const selectSuggestion = (suggestion: IssueDocentSearchSuggestion) => {
    clearSuggestionRequest();
    setSuggestions([]);
    setIsSuggestionsOpen(false);
    router.push(searchPath(suggestion.query));
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-[64px] border-b border-[#e0e0e0] bg-[#ffffff]/95 backdrop-blur">
        <div className="flex h-full items-center px-8">
          <BrandMark />
          <nav className="ml-[220px] flex items-center gap-1 text-[14px] font-semibold text-[#1d1d1f]">
            {navItems.map((item, index) => (
              <Link
                key={item}
                href={navHrefs[index]}
                className={`rounded-full px-3 py-2 ${index === activeIndex ? "bg-[#f7f8fa] text-[#1d1d1f]" : "hover:bg-[#fbfcfd]"}`}
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="relative ml-3">
            <form
              className="flex h-9 w-[220px] items-center gap-2 rounded-full border border-[#e0e0e0] bg-white px-3 text-[13px] text-[#7a7a7a] transition focus-within:border-[#c96442] focus-within:ring-2 focus-within:ring-[#c96442]/15"
              onSubmit={submitSearch}
            >
              <button
                aria-label="검색"
                className="grid h-5 w-5 place-items-center text-[#7a7a7a] transition hover:text-[#1d1d1f]"
                type="submit"
              >
                <Search className="h-[17px] w-[17px]" />
              </button>
              <input
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#7a7a7a]"
                defaultValue={currentSearchQuery}
                key={currentSearchQuery}
                maxLength={ISSUE_DOCENT_SEARCH_MAX_LENGTH}
                name="q"
                onBlur={() => {
                  setTimeout(() => setIsSuggestionsOpen(false), 120);
                }}
                onChange={(event) => requestSuggestions(event.currentTarget.value)}
                onFocus={(event) => requestSuggestions(event.currentTarget.value)}
                placeholder="이슈, 종목, 섹터 검색"
                type="search"
              />
            </form>
            {isSuggestionsOpen && (suggestions.length > 0 || isSuggesting) && (
              <div className="absolute left-0 top-11 z-50 w-[320px] overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]">
                {isSuggesting && suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-[#7a7a7a]">검색 후보를 찾는 중...</div>
                ) : (
                  <ul className="max-h-[300px] overflow-y-auto py-1">
                    {suggestions.map((suggestion) => (
                      <li key={`${suggestion.type}-${suggestion.query}`}>
                        <button
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#fbfcfd] focus:bg-[#fbfcfd] focus:outline-none"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectSuggestion(suggestion)}
                          type="button"
                        >
                          <span className="shrink-0 rounded-md border border-[#efd9d1] bg-[#fff7f3] px-2 py-1 text-[12px] font-semibold text-[#b65335]">
                            {suggestionTypeLabels[suggestion.type]}
                          </span>
                          <span className="min-w-0 truncate text-[14px] font-medium text-[#1d1d1f]">
                            {suggestion.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <Bell className="ml-auto h-5 w-5 text-[#7a7a7a]" />
          {isLoggedIn ? (
            <div className="ml-7">
              <UserMenuDropdown
                nickname={user?.nickname ?? "사용자"}
                hasInterests={hasInterests}
                onOpenOnboarding={openOnboarding}
                onLogout={() => setShowLogoutConfirm(true)}
              />
            </div>
          ) : (
            <button
              className="ml-7 h-10 rounded-lg bg-[#c96442] px-5 text-[14px] font-semibold text-white transition hover:bg-[#b65335]"
              onClick={openLoginModal}
              type="button"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
      {showOnboarding && (
        <OnboardingModal
          profile={draftProfile}
          onChange={setDraftProfile}
          onComplete={completeOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}
