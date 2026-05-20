import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { SectorCompaniesMeta } from "@/components/SectorCompaniesMeta";
import {
  formatIssueDocentDateTime,
  getIssueDocents,
  ISSUE_DOCENT_SEARCH_MAX_LENGTH,
} from "@/lib/issueDocent";
import {
  clampPage,
  getOffsetForPage,
  getPaginationPages,
  normalizePageParam,
} from "@/lib/pagination";
import type { IssueDocentListItem } from "@/types/issueDocent";

const ISSUE_DOCENT_PAGE_SIZE = 10;

function IssueDocentFeedRow({ item }: { item: IssueDocentListItem }) {
  return (
    <Link
      className="group block border-b border-[#e0e0e0] p-5 transition hover:bg-[#fbfcfd]"
      href={`/issue-docent/${item.id}`}
    >
      <h2 className="ko-title text-[20px] font-semibold leading-7 text-[#1d1d1f]">
        {item.title}
      </h2>
      <p className="ko-body mt-2 line-clamp-2 text-[15px] leading-6 text-[#7a7a7a]">
        {item.teaser}
      </p>
      <SectorCompaniesMeta groups={item.sector_companies} />
      <p className="mt-5 text-[13px] text-[#7a7a7a]">
        기사 {item.article_count}개 기반 · {formatIssueDocentDateTime(item.created_at)}
      </p>
    </Link>
  );
}

function pageHref(page: number, searchQuery?: string) {
  const searchParams = new URLSearchParams({ page: String(page) });
  if (searchQuery) searchParams.set("q", searchQuery);
  return `/issue-docent?${searchParams.toString()}`;
}

function PaginationLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className="grid h-9 min-w-9 place-items-center rounded-md border border-[#e0e0e0] px-3 text-[14px] font-semibold text-[#1d1d1f] transition hover:border-[#c96442] hover:text-[#b65335]"
      href={href}
    >
      {children}
    </Link>
  );
}

function PaginationDisabled({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-9 min-w-9 place-items-center rounded-md border border-[#eeeeee] px-3 text-[14px] font-semibold text-[#b8b8b8]">
      {children}
    </span>
  );
}

function IssueDocentPagination({
  currentPage,
  totalPages,
  searchQuery,
}: {
  currentPage: number;
  totalPages: number;
  searchQuery?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = getPaginationPages({ currentPage, totalPages });
  const previousPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);

  return (
    <nav
      aria-label="이슈 도슨트 페이지"
      className="mt-8 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-2">
        {currentPage === 1 ? (
          <PaginationDisabled>처음</PaginationDisabled>
        ) : (
          <PaginationLink href={pageHref(1, searchQuery)}>처음</PaginationLink>
        )}
        {currentPage === 1 ? (
          <PaginationDisabled>이전</PaginationDisabled>
        ) : (
          <PaginationLink href={pageHref(previousPage, searchQuery)}>이전</PaginationLink>
        )}
        {pages.map((page) =>
          page === currentPage ? (
            <span
              key={page}
              aria-current="page"
              className="grid h-9 min-w-9 place-items-center rounded-md bg-[#1d1d1f] px-3 text-[14px] font-semibold text-white"
            >
              {page}
            </span>
          ) : (
            <PaginationLink key={page} href={pageHref(page, searchQuery)}>
              {page}
            </PaginationLink>
          ),
        )}
        {currentPage === totalPages ? (
          <PaginationDisabled>다음</PaginationDisabled>
        ) : (
          <PaginationLink href={pageHref(nextPage, searchQuery)}>다음</PaginationLink>
        )}
        {currentPage === totalPages ? (
          <PaginationDisabled>끝</PaginationDisabled>
        ) : (
          <PaginationLink href={pageHref(totalPages, searchQuery)}>끝</PaginationLink>
        )}
      </div>

      <form action="/issue-docent" className="flex items-center gap-2 text-[14px] text-[#7a7a7a]">
        {searchQuery && <input name="q" type="hidden" value={searchQuery} />}
        <label htmlFor="issue-docent-page-input" className="font-semibold text-[#1d1d1f]">
          페이지
        </label>
        <input
          className="h-9 w-16 rounded-md border border-[#e0e0e0] bg-white px-3 text-center text-[14px] font-semibold text-[#1d1d1f] outline-none transition focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
          defaultValue={currentPage}
          id="issue-docent-page-input"
          max={totalPages}
          min={1}
          name="page"
          type="number"
        />
        <span>/ {totalPages}</span>
        <button
          className="h-9 rounded-md border border-[#e0e0e0] bg-white px-4 text-[14px] font-semibold text-[#1d1d1f] transition hover:border-[#c96442] hover:text-[#b65335]"
          type="submit"
        >
          이동
        </button>
      </form>
    </nav>
  );
}

interface IssueDocentPageProps {
  searchParams?: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
}

export default async function IssueDocentPage({ searchParams }: IssueDocentPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawPage = resolvedSearchParams?.page;
  const rawQuery = resolvedSearchParams?.q;
  const searchQuery =
    (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)
      ?.trim()
      .slice(0, ISSUE_DOCENT_SEARCH_MAX_LENGTH) || undefined;
  const requestedPage = normalizePageParam(rawPage);
  const hasInvalidPageParam =
    rawPage !== undefined &&
    (Array.isArray(rawPage) ? rawPage[0] : rawPage) !== String(requestedPage);
  const response = await getIssueDocents({
    limit: ISSUE_DOCENT_PAGE_SIZE,
    offset: getOffsetForPage(requestedPage, ISSUE_DOCENT_PAGE_SIZE),
    q: searchQuery,
  });
  const totalPages = Math.max(1, Math.ceil(response.total / ISSUE_DOCENT_PAGE_SIZE));
  const currentPage = clampPage(requestedPage, totalPages);

  if (hasInvalidPageParam || currentPage !== requestedPage) {
    redirect(pageHref(currentPage, searchQuery));
  }

  return (
    <div className="min-h-screen min-w-[1376px] bg-white text-[#1d1d1f]">
      <Header activeIndex={1} searchQuery={searchQuery} />
      <main className="mx-[100px] w-[1176px] bg-white pb-16 pt-4">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-semibold">이슈 도슨트</h1>
            {searchQuery ? (
              <p className="mt-2 text-[14px] text-[#7a7a7a]">
                <span className="font-semibold text-[#1d1d1f]">“{searchQuery}”</span> 검색 결과
                · 총 {response.total.toLocaleString("ko-KR")}개 이슈
              </p>
            ) : (
              <p className="mt-2 text-[14px] text-[#7a7a7a]">
                총 {response.total.toLocaleString("ko-KR")}개 이슈
              </p>
            )}
          </div>
          {searchQuery && (
            <Link
              className="rounded-md border border-[#e0e0e0] px-4 py-2 text-[14px] font-semibold text-[#1d1d1f] transition hover:border-[#c96442] hover:text-[#b65335]"
              href="/issue-docent"
            >
              전체 이슈 보기
            </Link>
          )}
        </div>
        <div className="mt-6">
          {response.items.length > 0 ? (
            response.items.map((item) => <IssueDocentFeedRow key={item.id} item={item} />)
          ) : (
            <div className="rounded-lg border border-dashed border-[#e0e0e0] bg-[#f7f8fa] px-8 py-10 text-[15px] text-[#7a7a7a]">
              {searchQuery ? "검색 결과가 없어요." : "아직 생성된 이슈 도슨트가 없어요."}
            </div>
          )}
        </div>
        <IssueDocentPagination
          currentPage={currentPage}
          searchQuery={searchQuery}
          totalPages={totalPages}
        />
      </main>
    </div>
  );
}
