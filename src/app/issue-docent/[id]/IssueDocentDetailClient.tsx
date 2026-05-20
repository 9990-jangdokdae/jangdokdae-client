"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpenCheck, Check, Cpu, ExternalLink, Gamepad2, X } from "lucide-react";
import { Header } from "@/components/Header";
import { InterestRail } from "@/components/InterestRail";
import { SectorCompaniesMeta } from "@/components/SectorCompaniesMeta";
import { AppModal } from "@/components/ui/AppModal";
import {
  fetchAnalyzerDetail,
  fetchAnalyzerSidebarContext,
  formatIssueDocentDate,
  formatIssueDocentDateTime,
} from "@/lib/issueDocent";
import type {
  AnalysisSection,
  KeyMetric,
  RelatedCompany,
  RelatedMarket,
  SidebarContext,
} from "@/types/jangdokdae";
import type {
  IssueDocentDetailResponse,
  IssueDocentQuiz,
  MatchedTerm,
  ExplanationSection,
} from "@/types/issueDocent";

interface TermDefinition {
  term: string;
  definition: string;
  category?: string;
}

interface AnalyzerState {
  clusterId: string | null;
  analysisSections: AnalysisSection[];
  sidebarContext: SidebarContext | null;
}

function splitParagraphByMatchedTerms(text: string, terms: MatchedTerm[]) {
  const validTerms = terms
    .filter((term) => term.start >= 0 && term.end > term.start && term.end <= text.length)
    .sort((a, b) => a.start - b.start);

  const parts: Array<{ text: string; term: MatchedTerm | null }> = [];
  let cursor = 0;

  for (const term of validTerms) {
    if (term.start < cursor) continue;
    if (term.start > cursor) {
      parts.push({ text: text.slice(cursor, term.start), term: null });
    }
    parts.push({ text: text.slice(term.start, term.end), term });
    cursor = term.end;
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), term: null });
  }

  return parts.length > 0 ? parts : [{ text, term: null }];
}

function splitParagraphByTerms(paragraph: string, terms: TermDefinition[]) {
  const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length);
  const escapedTerms = sortedTerms.map((term) => term.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escapedTerms.length === 0) return [{ text: paragraph, term: null as TermDefinition | null }];

  const matcher = new RegExp(`(${escapedTerms.join("|")})`, "g");
  return paragraph.split(matcher).filter(Boolean).map((text) => ({
    text,
    term: sortedTerms.find((candidate) => candidate.term === text) ?? null,
  }));
}

function ParagraphWithTerms({
  text,
  terms,
  onOpenTerm,
}: {
  text: string;
  terms: MatchedTerm[];
  onOpenTerm: (term: TermDefinition) => void;
}) {
  return (
    <p className="ko-body text-[17px] leading-8 text-[#1d1d1f]">
      {splitParagraphByMatchedTerms(text, terms).map((part, index) => {
        const term = part.term;

        return term ? (
          <button
            key={`${part.text}-${index}`}
            className="rounded-sm bg-[#fff1ec] px-1 font-semibold text-[#b65335] underline decoration-[#c96442]/45 decoration-dotted underline-offset-4 transition hover:bg-[#f7ded5] focus:outline-none focus:ring-2 focus:ring-[#c96442]/35"
            onClick={() =>
              onOpenTerm({
                term: term.term,
                definition: term.definition,
                category: term.category,
              })
            }
            type="button"
          >
            {part.text}
          </button>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        );
      })}
    </p>
  );
}

function InlineTermsText({
  text,
  terms,
  onOpenTerm,
  className,
}: {
  text: string;
  terms: TermDefinition[];
  onOpenTerm: (term: TermDefinition) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {splitParagraphByTerms(text, terms).map((part, index) =>
        part.term ? (
          <button
            key={`${part.text}-${index}`}
            type="button"
            className="rounded-sm bg-[#fff1ec] px-1 font-semibold text-[#b65335] underline decoration-[#c96442]/45 decoration-dotted underline-offset-4 transition hover:bg-[#f7ded5] focus:outline-none focus:ring-2 focus:ring-[#c96442]/35"
            onClick={() => onOpenTerm(part.term!)}
          >
            {part.text}
          </button>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </div>
  );
}

function QuizCard({ quiz }: { quiz: IssueDocentQuiz }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const answered = selectedIndex !== null;
  const selectedIsAnswer = selectedIndex === quiz.answer_index;

  return (
    <article className="rounded-lg border border-[#e0e0e0] bg-white p-6">
      <p className="text-[13px] font-semibold text-[#c96442]">
        {quiz.kind === "term" ? "용어 퀴즈" : "이슈 이해 퀴즈"}
      </p>
      <h3 className="ko-title mt-3 text-[20px] font-semibold leading-7 text-[#1d1d1f]">
        {quiz.question}
      </h3>
      <div className="mt-5 grid gap-3">
        {quiz.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isAnswer = index === quiz.answer_index;
          const stateClass = isSelected
            ? selectedIsAnswer
              ? "border-[#5db872] bg-[#effaf2] text-[#245a31]"
              : "border-[#c64545] bg-[#fff0f0] text-[#8a2b2b]"
            : answered && isAnswer
              ? "border-[#5db872] bg-[#effaf2] text-[#245a31]"
              : "border-[#e0e0e0] bg-white text-[#1d1d1f] hover:border-[#c96442]";

          return (
            <button
              key={`${quiz.quiz_id}-${option}`}
              className={`flex min-h-12 items-center justify-between rounded-lg border px-4 text-left text-[15px] font-semibold transition ${stateClass}`}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <span className="ko-label">{option}</span>
              {isSelected && selectedIsAnswer && <Check className="h-5 w-5" />}
              {isSelected && !selectedIsAnswer && <X className="h-5 w-5" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-5 rounded-lg bg-[#fbfcfd] p-4 text-[14px] leading-6 text-[#1d1d1f]">
          <strong className="text-[#1d1d1f]">
            {selectedIndex === quiz.answer_index ? "맞았어요." : "조금 아쉬워요."}
          </strong>
          <span className="ko-body ml-1">{quiz.explanation}</span>
        </div>
      )}
    </article>
  );
}

function AnalysisCard({
  section,
  terms,
  onOpenTerm,
}: {
  section: AnalysisSection;
  terms: TermDefinition[];
  onOpenTerm: (term: TermDefinition) => void;
}) {
  return (
    <article className="rounded-lg border border-[#e0e0e0] bg-white px-6 py-6">
      <h2 className="ko-title text-[26px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{section.title}</h2>
      <InlineTermsText
        text={section.summary}
        terms={terms}
        onOpenTerm={onOpenTerm}
        className="ko-body mt-4 text-[16px] leading-8 text-[#35363a]"
      />
    </article>
  );
}

function RelatedCompanyItem({ company }: { company: RelatedCompany }) {
  const priceChangeClass = company.priceChangePct?.trim().startsWith("-")
    ? "text-[#2d6cdf]"
    : "text-[#d14b3f]";

  return (
    <div className="rounded-lg border border-[#e0e0e0] bg-[#fbfcfd] px-4 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#5f4032]">{company.name}</p>
          {(company.ticker || company.subtitle) && (
            <p className="mt-0.5 break-keep text-[12px] leading-5 text-[#7a5542]">
              {[company.ticker, company.subtitle].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {(company.currentPrice || company.priceChangePct) && (
          <div className="shrink-0 text-right">
            {company.currentPrice && <p className="whitespace-nowrap text-[14px] font-semibold text-[#1d1d1f]">{company.currentPrice}</p>}
            {company.priceChangePct && <p className={`mt-0.5 whitespace-nowrap text-[12px] font-semibold ${priceChangeClass}`}>{company.priceChangePct}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricItem({
  metric,
  terms,
  onOpenTerm,
}: {
  metric: KeyMetric;
  terms: TermDefinition[];
  onOpenTerm: (term: TermDefinition) => void;
}) {
  return (
    <div className="rounded-lg border border-[#e8dfd8] bg-[#fefaf7] px-4 py-2.5">
      <p className="text-[12px] font-semibold text-[#7a5542]">{metric.label}</p>
      <p className="mt-1 text-[17px] font-semibold text-[#1d1d1f]">{metric.value}</p>
      {metric.emphasis && (
        <InlineTermsText
          text={metric.emphasis}
          terms={terms}
          onOpenTerm={onOpenTerm}
          className="mt-0.5 text-[12px] font-medium leading-5 text-[#9a6a4f]"
        />
      )}
    </div>
  );
}

function MarketItem({
  market,
  terms,
  onOpenTerm,
}: {
  market: RelatedMarket;
  terms: TermDefinition[];
  onOpenTerm: (term: TermDefinition) => void;
}) {
  const icon = market.name.includes("게임") ? (
    <Gamepad2 className="h-4 w-4" />
  ) : market.name.includes("반도체") ? (
    <Cpu className="h-4 w-4" />
  ) : (
    <Activity className="h-4 w-4" />
  );

  return (
    <div className="rounded-lg border border-[#f1d2c6] bg-[#fff7f3] px-4 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fff1ec] text-[#c96442]">
            {icon}
          </span>
          <p className="text-[12px] font-bold tracking-[0.08em] text-[#c96442] uppercase">{market.name}</p>
        </div>
        {(market.value || market.changePct) && (
          <div className="shrink-0 text-right">
            {market.value && <p className="whitespace-nowrap text-[15px] font-semibold text-[#1d1d1f]">{market.value}</p>}
            {market.changePct && <p className="mt-1 whitespace-nowrap text-[13px] font-bold text-[#c96442]">{market.changePct}</p>}
          </div>
        )}
      </div>
      {market.summary && (
        <InlineTermsText
          text={market.summary}
          terms={terms}
          onOpenTerm={onOpenTerm}
          className="ko-body mt-2 text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[#1f2430]"
        />
      )}
    </div>
  );
}

function SidebarCard({
  companies,
  markets,
  metrics,
  terms,
  onOpenTerm,
}: {
  companies: RelatedCompany[];
  markets: RelatedMarket[];
  metrics: KeyMetric[];
  terms: TermDefinition[];
  onOpenTerm: (term: TermDefinition) => void;
}) {
  return (
    <aside className="sticky top-24 self-start xl:w-[380px]">
      <div className="space-y-2">
        {companies.length > 0 && (
          <div className="grid gap-2">
            {companies.map((company) => (
              <RelatedCompanyItem
                key={`${company.name}-${company.ticker ?? ""}`}
                company={company}
              />
            ))}
          </div>
        )}

        {markets.length > 0 && (
          <div className="grid gap-2">
            {markets.map((market) => (
              <MarketItem
                key={`${market.name}-${market.summary}`}
                market={market}
                terms={terms}
                onOpenTerm={onOpenTerm}
              />
            ))}
          </div>
        )}

        {metrics.length > 0 && (
          <div className="grid gap-2">
            {metrics.map((metric) => (
              <MetricItem
                key={`${metric.label}-${metric.value}`}
                metric={metric}
                terms={terms}
                onOpenTerm={onOpenTerm}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export function IssueDocentDetailClient({
  issueDocent,
}: {
  issueDocent: IssueDocentDetailResponse;
}) {
  const [selectedTerm, setSelectedTerm] = useState<TermDefinition | null>(null);
  const [showArticles, setShowArticles] = useState(false);
  const analyzerClusterId = String(issueDocent.cluster_id);
  const [analyzerState, setAnalyzerState] = useState<AnalyzerState>({
    clusterId: null,
    analysisSections: [],
    sidebarContext: null,
  });
  const analysisSections = useMemo(
    () => (analyzerState.clusterId === analyzerClusterId ? analyzerState.analysisSections : []),
    [analyzerClusterId, analyzerState.analysisSections, analyzerState.clusterId],
  );
  const sidebarContext = useMemo(
    () => (analyzerState.clusterId === analyzerClusterId ? analyzerState.sidebarContext : null),
    [analyzerClusterId, analyzerState.clusterId, analyzerState.sidebarContext],
  );

  const summaryParagraphs = useMemo(() => {
    if ((issueDocent.summary?.paragraphs?.length ?? 0) > 0) {
      return issueDocent.summary.paragraphs;
    }

    const explanationSections = issueDocent.explanation ?? [];
    if (explanationSections.length > 0) {
      return explanationSections.flatMap((section: ExplanationSection) => section.paragraphs ?? []);
    }

    return [];
  }, [issueDocent.explanation, issueDocent.summary]);

  const glossaryTerms = useMemo<TermDefinition[]>(() => {
    const seen = new Set<string>();
    const terms: TermDefinition[] = [];

    for (const paragraph of summaryParagraphs) {
      for (const term of paragraph.matched_terms ?? []) {
        const key = `${term.term}::${term.definition}`;
        if (seen.has(key)) continue;
        seen.add(key);
        terms.push({
          term: term.term,
          definition: term.definition,
          category: term.category,
        });
      }
    }

    return terms;
  }, [summaryParagraphs]);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnalyzer = async () => {
      const nextState: AnalyzerState = {
        clusterId: analyzerClusterId,
        analysisSections: [],
        sidebarContext: null,
      };

      try {
        try {
          const analyzerDetail = await fetchAnalyzerDetail(analyzerClusterId, controller.signal);
          nextState.analysisSections = analyzerDetail.analysisSections;
          nextState.sidebarContext = analyzerDetail.sidebarContext;
          setAnalyzerState({ ...nextState });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }

        const liveSidebar = await fetchAnalyzerSidebarContext(
          analyzerClusterId,
          controller.signal,
          nextState.sidebarContext,
        );

        if (liveSidebar) {
          nextState.sidebarContext = liveSidebar;
          setAnalyzerState({ ...nextState });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    };

    void loadAnalyzer();

    return () => controller.abort();
  }, [analyzerClusterId]);

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <Header activeIndex={1} />
      <InterestRail />

      <main className="mx-auto max-w-[1280px] bg-white px-6 pb-24 pt-8 lg:px-8">
        <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <article className="min-w-0 xl:max-w-[770px]">
            <header className="border-b border-[#e0e0e0] pb-8">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-[#c96442]">
                <BookOpenCheck className="h-4 w-4" />
                이슈 도슨트
              </p>
              <div className="mt-4 flex items-start justify-between gap-6">
                <h1 className="ko-title text-[34px] font-normal leading-[1.15] text-[#1d1d1f]">
                  {issueDocent.title}
                </h1>
                <button
                  className="mt-1 h-10 shrink-0 rounded-lg border border-[#e0e0e0] bg-white px-4 text-[14px] font-semibold text-[#1d1d1f] transition hover:border-[#c96442] hover:text-[#b65335]"
                  onClick={() => setShowArticles(true)}
                  type="button"
                >
                  원문 보기
                </button>
              </div>
              <SectorCompaniesMeta groups={issueDocent.sector_companies} />
              <p className="mt-5 text-[13px] font-medium text-[#7a7a7a]">
                기사 {issueDocent.article_count}개 기반 · {formatIssueDocentDateTime(issueDocent.created_at)}
              </p>
            </header>

            <section className="w-full space-y-5 py-8">
              {summaryParagraphs.map((paragraph, index) => (
                <ParagraphWithTerms
                  key={`${paragraph.text}-${index}`}
                  onOpenTerm={setSelectedTerm}
                  terms={paragraph.matched_terms}
                  text={paragraph.text}
                />
              ))}
            </section>

            {analysisSections.length > 0 && (
              <section className="w-full border-t border-[#e0e0e0] py-8">
                <div className="grid gap-5">
                  {analysisSections.map((section) => (
                    <AnalysisCard
                      key={section.title}
                      onOpenTerm={setSelectedTerm}
                      section={section}
                      terms={glossaryTerms}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="w-full border-t border-[#e0e0e0] py-8">
              <h2 className="text-[26px] font-semibold text-[#1d1d1f]">퀴즈</h2>
              <p className="mt-2 text-[14px] text-[#7a7a7a]">보기를 누르면 바로 채점됩니다.</p>
              <div className="mt-5 grid gap-4">
                {issueDocent.quizzes.map((quiz) => (
                  <QuizCard key={quiz.quiz_id} quiz={quiz} />
                ))}
              </div>
            </section>
          </article>

          {sidebarContext && (
            <SidebarCard
              companies={sidebarContext.relatedCompanies}
              markets={sidebarContext.relatedMarkets}
              metrics={sidebarContext.keyMetrics}
              onOpenTerm={setSelectedTerm}
              terms={glossaryTerms}
            />
          )}
        </div>
      </main>

      {showArticles && (
        <AppModal title="원문 보기" onClose={() => setShowArticles(false)}>
          <div className="grid gap-4">
            {issueDocent.articles.map((article) => (
              <article
                key={article.article_id}
                className="rounded-lg border border-[#e0e0e0] bg-[#fbfcfd] p-4"
              >
                <h3 className="ko-title text-[17px] font-semibold leading-6 text-[#1d1d1f]">
                  {article.title}
                </h3>
                <p className="mt-2 text-[13px] text-[#7a7a7a]">
                  {article.press ?? "출처 미상"} · {formatIssueDocentDate(article.published_date)}
                </p>
                <a
                  className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-[#c96442]"
                  href={article.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  원문 열기
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </AppModal>
      )}

      {selectedTerm && (
        <AppModal title={selectedTerm.term} onClose={() => setSelectedTerm(null)}>
          {selectedTerm.category && (
            <p className="text-[13px] font-semibold text-[#c96442]">{selectedTerm.category}</p>
          )}
          <p className="ko-body mt-3 text-[16px] leading-7 text-[#1d1d1f]">
            {selectedTerm.definition}
          </p>
        </AppModal>
      )}
    </div>
  );
}
