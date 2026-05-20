"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useInterestProfile } from "@/hooks/useInterestProfile";
import { matchesInterest } from "@/lib/issue-match";
import { getIssueDocents } from "@/lib/issueDocent";
import type { IssueDocentListItem } from "@/types/issueDocent";
import { SectorCompaniesMeta } from "@/components/SectorCompaniesMeta";

const HOME_SECTION_ITEM_LIMIT = 4;
const HOME_INTEREST_FETCH_LIMIT = 20;
const HOME_INTEREST_MAX_SCAN = 60;

function formatCollectedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function IssueCard({ item, featured = false }: { item: IssueDocentListItem; featured?: boolean }) {
  return (
    <Link
      href={`/issue-docent/${item.id}`}
      className={`group flex h-full flex-col rounded-lg border border-[#e0e0e0] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c96442] ${
        featured ? "min-h-[230px]" : "min-h-[190px]"
      }`}
    >
      <div className="flex items-center gap-2 text-[12px] font-semibold text-[#7a7a7a]">
        <span>장독대 이슈</span>
        <span className="h-1 w-1 rounded-full bg-[#e0e0e0]" />
        <span>{formatCollectedAt(item.created_at)} 수집</span>
      </div>
      <h3 className="ko-title mt-4 text-[21px] font-semibold leading-7 text-[#1d1d1f] group-hover:text-[#b65335]">
        {item.title}
      </h3>
      <p className="ko-body mt-4 line-clamp-3 text-[15px] leading-6 text-[#1d1d1f]">{item.teaser}</p>
      <SectorCompaniesMeta groups={item.sector_companies} />
      <div className="mt-auto flex items-center pt-5 text-[14px] font-semibold text-[#c96442]">
        쉽게 읽기
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function IssueSection({
  title,
  description,
  items,
  empty,
  loading = false,
}: {
  title: string;
  description: string;
  items: IssueDocentListItem[];
  empty?: string;
  loading?: boolean;
}) {
  return (
    <section className="py-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="ko-title text-[26px] font-semibold text-[#1d1d1f]">{title}</h2>
          <p className="ko-body mt-2 text-[14px] text-[#7a7a7a]">{description}</p>
        </div>
      </div>
      {items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <IssueCard key={item.id} item={item} featured={index === 0} />
            ))}
          </div>
          {loading && (
            <p className="mt-3 text-[13px] font-medium text-[#7a7a7a]">
              관심 이슈를 더 찾고 있어요.
            </p>
          )}
        </>
      ) : loading ? (
        <div className="rounded-lg border border-dashed border-[#e0e0e0] bg-[#fbfcfd] p-7 text-[15px] leading-6 text-[#7a7a7a]">
          관심 이슈를 더 찾고 있어요.
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#e0e0e0] bg-[#fbfcfd] p-7 text-[15px] leading-6 text-[#7a7a7a]">
          {empty}
        </div>
      )}
    </section>
  );
}

export function HomeIssueSections({
  initialItems,
  total,
}: {
  initialItems: IssueDocentListItem[];
  total: number;
}) {
  const { profile } = useInterestProfile();
  const interestKey = useMemo(
    () => `${profile.sectors.join("|")}::${profile.companies.join("|")}`,
    [profile.companies, profile.sectors],
  );
  const [interestPool, setInterestPool] = useState(initialItems);
  const [nextInterestOffset, setNextInterestOffset] = useState(initialItems.length);
  const [interestSearchComplete, setInterestSearchComplete] = useState(false);
  const [loadingMoreInterests, setLoadingMoreInterests] = useState(false);
  const hasInterestProfile = profile.sectors.length > 0 || profile.companies.length > 0;
  const personalizedItems = useMemo(
    () =>
      interestPool
        .filter((item) => matchesInterest(item, profile))
        .slice(0, HOME_SECTION_ITEM_LIMIT),
    [interestPool, profile],
  );
  const marketItems = useMemo(
    () => initialItems.slice(0, HOME_SECTION_ITEM_LIMIT),
    [initialItems],
  );

  useEffect(() => {
    setInterestPool(initialItems);
    setNextInterestOffset(initialItems.length);
    setInterestSearchComplete(false);
    setLoadingMoreInterests(false);
  }, [initialItems, interestKey]);

  useEffect(() => {
    if (!hasInterestProfile) return;
    if (loadingMoreInterests || interestSearchComplete) return;
    if (personalizedItems.length >= HOME_SECTION_ITEM_LIMIT) return;

    const scanLimit = Math.min(total, HOME_INTEREST_MAX_SCAN);
    if (nextInterestOffset >= scanLimit) {
      setInterestSearchComplete(true);
      return;
    }

    let ignore = false;
    const loadMoreInterests = async () => {
      setLoadingMoreInterests(true);

      try {
        const response = await getIssueDocents({
          limit: HOME_INTEREST_FETCH_LIMIT,
          offset: nextInterestOffset,
        });

        if (ignore) return;

        setInterestPool((currentItems) => {
          const seenIds = new Set(currentItems.map((item) => item.id));
          const newItems = response.items.filter((item) => !seenIds.has(item.id));
          return [...currentItems, ...newItems];
        });
        setNextInterestOffset(nextInterestOffset + response.items.length);
        setInterestSearchComplete(
          response.items.length === 0 || nextInterestOffset + response.items.length >= scanLimit,
        );
      } catch (error) {
        if (!ignore) {
          console.error("[HomeIssueSections] 관심 이슈 추가 조회 실패:", error);
          setInterestSearchComplete(true);
        }
      } finally {
        if (!ignore) setLoadingMoreInterests(false);
      }
    };

    void loadMoreInterests();

    return () => {
      ignore = true;
    };
  }, [
    hasInterestProfile,
    interestSearchComplete,
    loadingMoreInterests,
    nextInterestOffset,
    personalizedItems.length,
    total,
  ]);

  return (
    <>
      <IssueSection
        title="내 관심 이슈"
        description="온보딩에서 고른 섹터와 종목에 맞춰 먼저 보여드려요."
        items={personalizedItems}
        loading={loadingMoreInterests}
        empty="아직 선택한 관심사와 딱 맞는 이슈가 없어요. 우측 내 관심에서 관심사를 넓히거나 아래 전체 시장 이슈를 확인해보세요."
      />

      <IssueSection
        title="오늘의 전체 시장 이슈"
        description="관심사 밖의 흐름도 놓치지 않도록 함께 모아두었습니다."
        items={marketItems}
        empty="표시할 이슈가 아직 없습니다."
      />
    </>
  );
}
