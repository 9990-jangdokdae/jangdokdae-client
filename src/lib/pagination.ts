export function normalizePageParam(page: string | string[] | undefined): number {
  const rawPage = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number.parseInt(rawPage ?? "", 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) return 1;

  return parsedPage;
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages < 1) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

export function getOffsetForPage(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function getPaginationPages({
  currentPage,
  totalPages,
  windowSize = 5,
}: {
  currentPage: number;
  totalPages: number;
  windowSize?: number;
}) {
  if (totalPages < 1) return [1];

  const safeWindowSize = Math.max(1, windowSize);
  const visibleCount = Math.min(safeWindowSize, totalPages);
  const halfWindow = Math.floor(visibleCount / 2);
  const clampedCurrentPage = clampPage(currentPage, totalPages);
  let start = clampedCurrentPage - halfWindow;
  let end = start + visibleCount - 1;

  if (start < 1) {
    start = 1;
    end = visibleCount;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - visibleCount + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
