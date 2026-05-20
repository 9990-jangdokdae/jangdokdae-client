"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInterestProfile } from "@/hooks/useInterestProfile";
import { ONBOARDING_INITIAL_PROFILE } from "@/lib/jangdokdaeData";
import type { InterestProfile } from "@/types/jangdokdae";
import { LogoutConfirmModal } from "@/app/auth/LogoutConfirmModal";
import { OnboardingModal } from "@/app/onboarding/OnboardingModal";
import { BrandMark } from "@/components/ui/BrandMark";
import { UserMenuDropdown } from "@/components/ui/UserMenuDropdown";

const navItems = ["오늘의 독해", "이슈", "마켓 정보"] as const;
const navHrefs = ["/", "/issue-docent", "/market/indices"] as const;

export function Header({ activeIndex }: { activeIndex: 0 | 1 | 2 }) {
  const { isLoggedIn, user, openLoginModal, logout } = useAuth();
  const { profile, saveProfile } = useInterestProfile();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [draftProfile, setDraftProfile] = useState<InterestProfile>(ONBOARDING_INITIAL_PROFILE);

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
          <button className="ml-3 flex h-9 w-[220px] items-center gap-2 rounded-full border border-[#e0e0e0] bg-white px-3 text-[13px] text-[#7a7a7a]" type="button">
            <Search className="h-[17px] w-[17px]" />
            이슈, 종목, 용어 검색
          </button>
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
