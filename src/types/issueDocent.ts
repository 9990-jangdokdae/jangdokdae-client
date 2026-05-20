export type QuizKind = "term" | "issue";

export interface IssueDocentListResponse {
  items: IssueDocentListItem[];
  total: number;
  limit: number;
  offset: number;
}

export type IssueDocentSearchSuggestionType = "issue" | "company" | "sector";

export interface IssueDocentSearchSuggestion {
  type: IssueDocentSearchSuggestionType;
  label: string;
  query: string;
}

export interface IssueDocentSearchSuggestionsResponse {
  suggestions: IssueDocentSearchSuggestion[];
}

export interface IssueDocentListItem {
  id: number;
  cluster_id: number;
  title: string;
  teaser: string;
  sector_companies: SectorCompanies[];
  article_count: number;
  created_at: string;
}

export interface SectorCompanies {
  sector: string | null;
  companies: SectorCompany[];
}

export interface SectorCompany {
  company_id: number | null;
  name: string;
  market: string | null;
}

export interface IssueDocentDetailResponse {
  id: number;
  cluster_id: number;
  title: string;
  teaser: string;
  sector_companies: SectorCompanies[];
  article_count: number;
  summary: SummaryContent;
  explanation?: ExplanationSection[];
  articles: SourceArticle[];
  quizzes: IssueDocentQuiz[];
  created_at: string;
}

export interface SummaryContent {
  paragraphs: SummaryParagraph[];
}

export interface ExplanationSection {
  section_type: string;
  title: string;
  paragraphs: SummaryParagraph[];
}

export interface SummaryParagraph {
  text: string;
  matched_terms: MatchedTerm[];
}

export interface MatchedTerm {
  term_id: number;
  term: string;
  category: string;
  definition: string;
  start: number;
  end: number;
}

export interface SourceArticle {
  article_id: string;
  title: string;
  press: string | null;
  published_date: string;
  url: string;
}

export interface IssueDocentQuiz {
  quiz_id: string;
  kind: QuizKind;
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}
