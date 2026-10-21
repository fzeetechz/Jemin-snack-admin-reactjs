import { apiRequest } from './api/apiClient';

interface PaginatedBody<T> { success?: boolean; message?: string; data?: T[] | Record<string, unknown>; pagination?: { pages?: number; totalPages?: number; total?: number; limit?: number } }
export async function fetchAllListingPages<T>(endpoint: string, collection: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  const seen = new Set<string>();
  while (true) {
    const response = await apiRequest.get<PaginatedBody<T>>(endpoint, { params: { ...params, page, limit: 100 } });
    if (response.success === false) throw new Error(response.message ?? 'Unable to fetch listing');
    const data = response.data;
    const body = data && !Array.isArray(data) ? data : {};
    const batch = Array.isArray(data) ? data : body[collection];
    if (!Array.isArray(batch)) throw new Error('Invalid listing response');
    const signature = JSON.stringify(batch.map((row) => row?._id ?? row?.id ?? row));
    if (batch.length && seen.has(signature)) throw new Error('The server returned the same page twice. Please refresh the listing.');
    seen.add(signature);
    rows.push(...batch);
    const pagination = (body.pagination ?? response.pagination) as { pages?: number; totalPages?: number; total?: number; limit?: number } | undefined;
    const pages = pagination?.pages ?? pagination?.totalPages ?? (pagination?.total != null ? Math.ceil(pagination.total / (pagination.limit ?? 100)) : undefined);
    if (pages == null || page >= pages || batch.length === 0) break;
    page += 1;
  }
  return rows;
}
