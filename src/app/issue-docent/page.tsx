import Link from "next/link";
import { Header } from "@/components/Header";
import { SectorCompaniesMeta } from "@/components/SectorCompaniesMeta";
import { formatIssueDocentDateTime, getIssueDocents } from "@/lib/issueDocent";
import type { IssueDocentListItem } from "@/types/issueDocent";

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

export default async function IssueDocentPage() {
  const response = await getIssueDocents({ limit: 20, offset: 0 });

  return (
    <div className="min-h-screen min-w-[1376px] bg-white text-[#1d1d1f]">
      <Header activeIndex={1} />
      <main className="mx-[100px] w-[1176px] bg-white pb-16 pt-4">
        <h1 className="text-[28px] font-semibold">이슈 도슨트</h1>
        <div className="mt-6">
          {response.items.length > 0 ? (
            response.items.map((item) => <IssueDocentFeedRow key={item.id} item={item} />)
          ) : (
            <div className="rounded-lg border border-dashed border-[#e0e0e0] bg-[#f7f8fa] px-8 py-10 text-[15px] text-[#7a7a7a]">
              아직 생성된 이슈 도슨트가 없어요.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
