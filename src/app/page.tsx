import { Header } from "@/components/Header";
import { HomeIssueSections } from "@/components/HomeIssueSections";
import { getIssueDocents } from "@/lib/issueDocent";

export default async function Home() {
  const response = await getIssueDocents({ limit: 20, offset: 0 });

  return (
    <div className="min-h-screen min-w-[1376px] bg-[#ffffff] text-[#1d1d1f]">
      <Header activeIndex={0} />

      <main className="mx-[100px] w-[1176px] bg-[#ffffff] pb-24 pt-8">

        <HomeIssueSections initialItems={response.items} total={response.total} />
      </main>

      <footer className="border-t border-[#e0e0e0] bg-[#ffffff] px-8 py-10 text-[13px] leading-6 text-[#7a7a7a]">
        <strong className="text-[#1d1d1f]">장독대</strong>
        <p className="mt-2">
          © 2026 9990. All rights reserved. 제공되는 정보는 학습과 시장 이해를 위한 콘텐츠이며, 특정 종목의 매수 또는 매도 권유가 아닙니다.
        </p>
      </footer>
    </div>
  );
}
