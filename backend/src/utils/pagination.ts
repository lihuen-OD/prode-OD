export function getPagination(page?: string, limit?: string) {
  const currentPage = Math.max(Number(page ?? 1) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit ?? 20) || 20, 1), 100);
  const skip = (currentPage - 1) * currentLimit;
  return { page: currentPage, limit: currentLimit, skip, take: currentLimit };
}
